import sys
import os

# Add ml-service root to python path to access other modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import torch
import torch.nn.functional as F
import redis
import json
import time
from torch_geometric.data import Data, Batch
from train_gnn import SupplyChainGNN
from feature_store.feature_extractor import extract_features
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379')
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "gnn", "gnn_model.pt")
META_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "metadata", "model_metadata.json")
FEATURES_DIR = os.path.join(os.path.dirname(__file__), "..", "datasets", "features")

class StreamPredictor:
    def __init__(self):
        self.model = None
        self.metadata = {}
        self.features = {'x': None, 'edge_index': None}
        self.group_name = "gnn_predictor"
        self.consumer_name = f"ml_worker_{os.getpid()}"
        
        self.load_model()
        self.refresh_features()
        self.setup_redis()

    def load_model(self):
        if not os.path.exists(META_PATH) or not os.path.exists(MODEL_PATH):
            print("[StreamPredictor] ⚠️ Model or metadata missing. Prediction may be inaccurate.")
            return

        with open(META_PATH, "r") as f:
            self.metadata = json.load(f)
        
        # The GNN model was trained with 6 base features + 5 node type features (one-hot) = 11
        in_features = 11
        
        self.model = SupplyChainGNN(in_features=in_features, hidden_dim=64)
        try:
            self.model.load_state_dict(torch.load(MODEL_PATH, weights_only=True))
            self.model.eval()
            print(f"[StreamPredictor] ✅ GNN Model loaded from {MODEL_PATH}")
        except Exception as e:
            print(f"[StreamPredictor] ❌ Error loading model: {e}")

    def refresh_features(self):
        """Loads or extracts cached graph features"""
        try:
            x_path = os.path.join(FEATURES_DIR, "x.pt")
            ei_path = os.path.join(FEATURES_DIR, "edge_index.pt")
            
            if not os.path.exists(x_path) or not os.path.exists(ei_path):
                print("[StreamPredictor] 🔄 Features missing. Running extractor...")
                extract_features()
            
            self.features['x'] = torch.load(x_path, weights_only=True)
            self.features['edge_index'] = torch.load(ei_path, weights_only=True)
            print(f"[StreamPredictor] 📦 Loaded cached features: {self.features['x'].shape[0]} nodes")
        except Exception as e:
            print(f"[StreamPredictor] ❌ Error refreshing features: {e}")

    def setup_redis(self):
        try:
            redis_client.xgroup_create("stream:disruptions", self.group_name, id="0", mkstream=True)
            print(f"[StreamPredictor] 🔗 Created consumer group {self.group_name}")
        except redis.exceptions.ResponseError as e:
            if "already exists" not in str(e):
                print(f"[StreamPredictor] ❌ Redis error: {e}")

    def run(self):
        print(f"[StreamPredictor] 📡 Listening for disruption events...")
        while True:
            try:
                # Read from disruptions stream
                events = redis_client.xreadgroup(
                    groupname=self.group_name,
                    consumername=self.consumer_name,
                    streams={"stream:disruptions": ">"},
                    count=5,
                    block=5000
                )
                
                if not events:
                    continue
                
                for stream, messages in events:
                    for message_id, msg_data in messages:
                        try:
                            envelope = json.loads(msg_data['data'])
                            self.process_event(envelope)
                            # Ack the message
                            redis_client.xack("stream:disruptions", self.group_name, message_id)
                        except Exception as e:
                            print(f"[StreamPredictor] ❌ Error processing message {message_id}: {e}")
                            
            except Exception as e:
                print(f"[StreamPredictor] ❌ Main loop error: {e}")
                time.sleep(2)

    def process_event(self, envelope):
        # 1. Update features if the event provides new node data
        # For now, we refresh graph topology/features from Neo4j periodically
        # or we could do it on every event if needed.
        # To keep it production-fast, we use a cached version but could update specific indices.
        
        # 2. Run Inference
        if self.model is None or self.features['x'] is None:
            return

        with torch.no_grad():
            data = Data(x=self.features['x'], edge_index=self.features['edge_index'])
            batch = Batch.from_data_list([data])
            out = self.model(batch)
            proba = F.softmax(out, dim=1)[0]
            
            risk_score = float(proba[1])
            prediction = int(out.argmax(dim=1)[0])
            
            print(f"[StreamPredictor] 🔮 Prediction for {envelope['event_id']}: Risk={risk_score:.4f} ({'DISRUPTED' if prediction == 1 else 'SAFE'})")
            
            # 3. Publish result
            prediction_event = {
                "event_id": f"risk_{envelope['event_id']}",
                "event_type": "risk.prediction",
                "source": "gnn_predictor",
                "timestamp": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
                "correlation_id": envelope.get("correlation_id", "unknown"),
                "payload": {
                    "original_event_id": envelope['event_id'],
                    "disruption_type": envelope['payload'].get('type', 'unknown'),
                    "risk_score": risk_score,
                    "prediction": prediction,
                    "confidence": float(proba.max()),
                    "affected_nodes": envelope['payload'].get('affected_nodes', [])
                }
            }
            
            redis_client.xadd("stream:risk.predictions", {"data": json.dumps(prediction_event)}, maxlen=1000)

if __name__ == "__main__":
    predictor = StreamPredictor()
    predictor.run()
