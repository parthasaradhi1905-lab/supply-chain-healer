"""
ML Disruption Prediction — FastAPI Inference Server

Endpoint: POST /predict
Accepts: { supplier_reliability, weather_risk, port_congestion, distance, inventory_level, geopolitical_risk, n_suppliers, n_routes, ... }
Returns: { risk: float, prediction: int, confidence: float, model_type: str }
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import numpy as np
import os
import json
import traceback

app = FastAPI(
    title="Supply Chain Disruption Predictor (GNN Enabled)",
    description="ML-based disruption risk prediction for the Aegis Nexus system",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DIR = os.path.dirname(__file__)

# Try importing torch and PyG
try:
    import torch
    import torch.nn.functional as F
    from torch_geometric.data import Batch
    from train_gnn import SupplyChainGNN, SupplyChainMLP, build_supply_chain_graph
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False

try:
    import xgboost as xgb
    HAS_XGB = True
except ImportError:
    HAS_XGB = False

# Load metadata
model_type = None
model = None
metadata = {}
meta_path = os.path.join(DIR, "model_metadata.json")

if os.path.exists(meta_path):
    with open(meta_path, "r") as f:
        metadata = json.load(f)
    model_type = metadata.get("model_type", "Unknown")

print(f"Loading model based on metadata: {model_type}")

# Load model based on type
try:
    if "GNN" in model_type and HAS_TORCH:
        features = metadata.get("features", [])
        model = SupplyChainGNN(in_features=len(features), hidden_dim=64)
        model.load_state_dict(torch.load(os.path.join(DIR, "gnn_model.pt"), weights_only=True))
        model.eval()
        print(f"✅ GNN Model loaded successfully")
        
    elif "MLP" in model_type and HAS_TORCH:
        checkpoint = torch.load(os.path.join(DIR, "gnn_model.pt"), weights_only=True)
        features = checkpoint.get("features", metadata.get("features", []))
        model = SupplyChainMLP(in_features=len(features), hidden_dim=128)
        model.load_state_dict(checkpoint["model_state"])
        model.eval()
        scaler_mean = np.array(checkpoint["scaler_mean"])
        scaler_scale = np.array(checkpoint["scaler_scale"])
        print(f"✅ Deep MLP Model loaded successfully")
        
    elif "XGB" in model_type and HAS_XGB:
        model = xgb.XGBClassifier()
        model.load_model(os.path.join(DIR, "disruption_model.json"))
        print(f"✅ XGBoost Model loaded successfully")
    else:
        print(f"⚠️  Dependencies missing for model type {model_type} or file not found.")
except Exception as e:
    print(f"⚠️  Error loading model: {e}")
    traceback.print_exc()


class PredictionInput(BaseModel):
    supplier_reliability: float = Field(..., ge=0, le=1)
    weather_risk: float = Field(..., ge=0, le=1)
    port_congestion: float = Field(..., ge=0, le=1)
    distance: float = Field(..., ge=0)
    inventory_level: float = Field(..., ge=0, le=1)
    geopolitical_risk: float = Field(..., ge=0, le=1)
    # Graph/topology features (optional, default to realistic baselines if omitted)
    n_suppliers: int = 5
    n_routes: int = 7
    avg_path_length: float = 3.5
    clustering_coeff: float = 0.4
    graph_density: float = 0.3


class PredictionOutput(BaseModel):
    risk: float
    prediction: int
    confidence: float
    risk_level: str
    model_used: str
    features_used: dict


@app.get("/")
def root():
    return {
        "service": "Supply Chain Disruption Predictor",
        "model_loaded": model is not None,
        "model_type": model_type,
    }


@app.post("/predict", response_model=PredictionOutput)
def predict(data: PredictionInput):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not initialized")

    features_dict = data.dict()
    feature_list = metadata.get("features", list(features_dict.keys()))
    
    # Extract feature values in correct order
    x_vals = []
    for f in feature_list:
        x_vals.append(features_dict.get(f, 0.0))

    risk_score = 0.0
    prediction = 0
    confidence = 0.0

    if "GNN" in model_type:
        # Build PyG Graph
        with torch.no_grad():
            graph_data = build_supply_chain_graph(features_dict, feature_list[:6]) # base features only for node feats
            batch = Batch.from_data_list([graph_data])
            out = model(batch)
            proba = F.softmax(out, dim=1)[0]
            risk_score = float(proba[1])
            prediction = int(out.argmax(dim=1)[0])
            confidence = float(proba.max())
            
    elif "MLP" in model_type:
        with torch.no_grad():
            x_arr = np.array([x_vals])
            x_scaled = (x_arr - scaler_mean) / scaler_scale
            x_tensor = torch.tensor(x_scaled, dtype=torch.float32)
            out = model(x_tensor)
            proba = F.softmax(out, dim=1)[0]
            risk_score = float(proba[1])
            prediction = int(out.argmax(dim=1)[0])
            confidence = float(proba.max())
            
    else:  # XGB
        x_arr = np.array([x_vals])
        pred_proba = model.predict_proba(x_arr)[0]
        prediction = int(model.predict(x_arr)[0])
        risk_score = float(pred_proba[1])
        confidence = float(max(pred_proba))

    risk_level = (
        "CRITICAL" if risk_score >= 0.8
        else "HIGH" if risk_score >= 0.6
        else "MEDIUM" if risk_score >= 0.4
        else "LOW"
    )

    return PredictionOutput(
        risk=round(risk_score, 4),
        prediction=prediction,
        confidence=round(confidence, 4),
        risk_level=risk_level,
        model_used=model_type,
        features_used=features_dict,
    )

