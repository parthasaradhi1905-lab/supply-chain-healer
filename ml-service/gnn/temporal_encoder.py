import torch
import torch.nn as nn
from torch_geometric.nn import GCNConv
import torch.nn.functional as F

class TemporalGNN(nn.Module):
    """
    Temporal Graph Neural Network for Supply Chain Risk Prediction.
    
    Architecture:
    Node Feature Vectors -> GCN (Spatial propagation) -> GRU (Temporal sequence modeling) -> Linear (Risk/Confidence outputs)
    """
    def __init__(self, in_channels, hidden_channels=32):
        super(TemporalGNN, self).__init__()
        
        # Spatial Graph Convolution
        # Learns how risk propagates among connected supply chain nodes (Factories -> Ports -> Warehouses)
        self.gcn = GCNConv(in_channels, hidden_channels)
        
        # Temporal Sequence Modeling
        # Learns how feature patterns (e.g. congestion buildup) evolve over time
        self.rnn = nn.GRU(input_size=hidden_channels, hidden_size=hidden_channels, batch_first=True)
        
        # Predictive Heads
        # 1. Prediction of disruption risk probability [0, 1]
        self.fc_risk = nn.Linear(hidden_channels, 1)
        # 2. Confidence/Uncertainty interval of that prediction [0, 1]
        self.fc_conf = nn.Linear(hidden_channels, 1)

    def forward(self, x, edge_index):
        # x: Node feature matrix. Shape: [num_nodes, in_channels]
        # edge_index: Graph connectivity. Shape: [2, num_edges]
        
        # Step 1: Spatial embedding
        x = self.gcn(x, edge_index)
        x = F.relu(x)
        
        # Step 2: Temporal embedding
        # Add sequence dimension for RNN (treating current state as sequence length 1 for online inference)
        x = x.unsqueeze(1) # Shape: [num_nodes, 1, hidden_channels]
        x, _ = self.rnn(x)
        
        # Flatten back
        x = x.squeeze(1) # Shape: [num_nodes, hidden_channels]
        
        # Step 3: Predictive heads
        risk_score = torch.sigmoid(self.fc_risk(x))
        confidence = torch.sigmoid(self.fc_conf(x))
        
        return risk_score, confidence
