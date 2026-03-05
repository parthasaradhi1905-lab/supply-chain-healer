import torch
import os

def save_model(model, version=1):
    save_dir = os.path.join(os.path.dirname(__file__), "..", "models")
    os.makedirs(save_dir, exist_ok=True)
    
    path = os.path.join(save_dir, f"model_v{version}.pt")
    torch.save(model.state_dict(), path)
    print(f"Model saved to registry: {path}")
