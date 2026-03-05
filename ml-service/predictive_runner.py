import redis
import json
import torch
import time
from gnn.temporal_encoder import TemporalGNN

# Initialize connections
r = redis.Redis(host='localhost', port=6379, decode_responses=True)

# Define mock graph structure for the supply chain
# Real implementation would load this dynamically from Neo4j (GraphLoader)
edge_index = torch.tensor([
    [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 0], 
    [1, 0, 2, 1, 3, 2, 4, 3, 5, 4, 0, 5]
], dtype=torch.long)

node_mapping = {
    "Shanghai": 0,
    "Singapore": 1,
    "Taiwan": 2,
    "Rotterdam": 3,
    "Detroit": 4,
    "Suez": 5
}

# The feature vector size is now 4 (ship_density, news_risk, weather_risk, port_congestion)
model = TemporalGNN(in_channels=4, hidden_channels=32)
model.eval() # Set to inference mode

def process_features():
    print("[PredictionEngine] Streaming Temporal GNN Risk Forecasts (4D Features)...")
    last_id = '$' # Only read new events
    
    # We maintain a state tensor of features per node
    num_nodes = len(node_mapping)
    current_features = torch.zeros((num_nodes, 4), dtype=torch.float32)

    while True:
        try:
            # Block and wait for new multi-dimensional features from Node.js Event Pipeline
            streams = r.xread({'stream:ml:features': last_id}, count=10, block=2000)
            
            if streams:
                for stream_name, events in streams:
                    for event_id, event_data in events:
                        last_id = event_id
                        
                        node_name = event_data.get('node')
                        if node_name in node_mapping:
                            idx = node_mapping[node_name]
                            
                            # Parse feature tensor
                            features = [
                                float(event_data.get('ship_density', 0)),
                                float(event_data.get('news_risk', 0)),
                                float(event_data.get('weather_risk', 0)),
                                float(event_data.get('port_congestion', 0))
                            ]
                            
                            current_features[idx] = torch.tensor(features)
                
                # Perform Temporal Inference over the graph
                with torch.no_grad():
                    # edge_index shape handling for dynamically updating subsets can be complex,
                    # here assuming static fully-updated graph state
                    risk_scores, confidences = model(current_features, edge_index)
                
                # Publish Predictions iteratively over the persistent XADD stream
                for node_name, idx in node_mapping.items():
                    # We might not have edges for all mapped nodes in this mock, avoid out-of-bounds
                    if idx < len(risk_scores):
                        risk = float(risk_scores[idx].item())
                        conf = float(confidences[idx].item())
                        
                        # Only broadcast signals that show some baseline volatility
                        if risk > 0.05:
                            r.xadd(
                                "stream:predictions",
                                {
                                    "node": node_name,
                                    "risk_score": str(round(risk, 4)),
                                    "confidence": str(round(conf, 4)),
                                    "time_window": "7 days" 
                                }
                            )
                            print(f"[PredictionEngine] Forecast -> {node_name} Risk: {risk:.2f} (Conf: {conf:.2f})")
                            
        except Exception as e:
            print(f"[PredictionEngine] Pipeline exception: {e}")
            time.sleep(2)

if __name__ == "__main__":
    process_features()
