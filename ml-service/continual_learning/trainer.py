import torch
import torch.nn as nn
import torch.optim as optim

def retrain_model(dataset):
    if len(dataset) == 0:
        print("Dataset empty. Skipping Retraining.")
        return None

    X = []
    y = []

    for row in dataset:
        X.append([
            row["risk_score"],
            row["delay"],
            row["nodes"]
        ])
        y.append(row["success"])

    X = torch.tensor(X, dtype=torch.float32)
    y = torch.tensor(y, dtype=torch.float32)

    # Simplified example model
    model = nn.Linear(3, 1)
    optimizer = optim.Adam(model.parameters(), lr=0.01)
    criterion = nn.MSELoss()

    for epoch in range(50):
        pred = model(X)
        loss = criterion(pred.squeeze(), y)
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

    return model
