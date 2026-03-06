import torch
import torch.nn as nn

class GraphPolicy(nn.Module):
    def __init__(self, embedding_dim, actions):
        super().__init__()
        self.fc1 = nn.Linear(embedding_dim, 128)
        self.fc2 = nn.Linear(128, actions)

    def forward(self, x):
        x = torch.relu(self.fc1(x))
        return self.fc2(x)
