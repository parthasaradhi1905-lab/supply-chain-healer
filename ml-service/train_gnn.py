"""
Graph Neural Network for Supply Chain Disruption Prediction

Architecture:
    Supply Chain Graph → GCN Layers → Global Pool → MLP Classifier → P(disruption)

Why GNN over XGBoost:
    - Models structural dependencies (supplier → port → factory → warehouse)
    - Learns from graph topology (clustering, path lengths, density)
    - Captures cascading disruption propagation
    - More appropriate for the graph-structured supply chain domain

Uses PyTorch + PyTorch Geometric.
Falls back to a competitive MLP if PyG is not installed.
"""

import pandas as pd
import numpy as np
import json
import os
import sys
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
from sklearn.preprocessing import StandardScaler

# Check if torch is available
try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
    from torch.utils.data import DataLoader, TensorDataset
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False

# Check if torch_geometric is available
try:
    from torch_geometric.nn import GCNConv, global_mean_pool
    from torch_geometric.data import Data, Batch
    HAS_PYG = True
except ImportError:
    HAS_PYG = False


# ============================================================
# GNN Model (with PyTorch Geometric)
# ============================================================
if HAS_TORCH and HAS_PYG:
    class SupplyChainGNN(nn.Module):
        """
        Graph Convolutional Network for disruption prediction.
        Operates on supply chain graph structure.
        """
        def __init__(self, in_features, hidden_dim=64, num_classes=2):
            super().__init__()
            self.conv1 = GCNConv(in_features, hidden_dim)
            self.conv2 = GCNConv(hidden_dim, hidden_dim)
            self.conv3 = GCNConv(hidden_dim, hidden_dim // 2)
            self.bn1 = nn.BatchNorm1d(hidden_dim)
            self.bn2 = nn.BatchNorm1d(hidden_dim)
            self.dropout = nn.Dropout(0.3)
            self.classifier = nn.Sequential(
                nn.Linear(hidden_dim // 2, 32),
                nn.ReLU(),
                nn.Dropout(0.2),
                nn.Linear(32, num_classes),
            )

        def forward(self, data):
            x, edge_index, batch = data.x, data.edge_index, data.batch

            x = self.conv1(x, edge_index)
            x = self.bn1(x)
            x = F.relu(x)
            x = self.dropout(x)

            x = self.conv2(x, edge_index)
            x = self.bn2(x)
            x = F.relu(x)
            x = self.dropout(x)

            x = self.conv3(x, edge_index)
            x = F.relu(x)

            # Global mean pooling (graph-level readout)
            x = global_mean_pool(x, batch)

            return self.classifier(x)

    def build_supply_chain_graph(row, feature_cols):
        """
        Build a PyG Data object from a dataset row.
        Creates a small supply chain graph for each scenario.
        """
        n_suppliers = int(row.get("n_suppliers", 5))
        n_nodes = n_suppliers + 4  # suppliers + port + factory + warehouse + retailer

        # Node features: each node gets the scenario features
        node_features = []
        for i in range(n_nodes):
            base_features = [row[col] for col in feature_cols]
            # Add node type encoding
            node_type = [0, 0, 0, 0, 0]  # supplier, port, factory, warehouse, retailer
            if i < n_suppliers:
                node_type[0] = 1
                # Vary reliability per supplier
                base_features[0] = max(0.5, base_features[0] + np.random.normal(0, 0.05))
            elif i == n_suppliers:
                node_type[1] = 1  # port
            elif i == n_suppliers + 1:
                node_type[2] = 1  # factory
            elif i == n_suppliers + 2:
                node_type[3] = 1  # warehouse
            else:
                node_type[4] = 1  # retailer

            node_features.append(base_features + node_type)

        x = torch.tensor(node_features, dtype=torch.float)

        # Build edges: supplier→port→factory→warehouse→retailer
        edges = []
        for s in range(n_suppliers):
            edges.append([s, n_suppliers])  # supplier → port
        edges.append([n_suppliers, n_suppliers + 1])      # port → factory
        edges.append([n_suppliers + 1, n_suppliers + 2])  # factory → warehouse
        edges.append([n_suppliers + 2, n_suppliers + 3])  # warehouse → retailer
        # Add reverse edges (undirected)
        reverse = [[e[1], e[0]] for e in edges]
        edges.extend(reverse)

        edge_index = torch.tensor(edges, dtype=torch.long).t().contiguous()

        y = torch.tensor([int(row["disruption"])], dtype=torch.long)

        return Data(x=x, edge_index=edge_index, y=y)


# ============================================================
# MLP Fallback (when PyTorch Geometric is not available)
# ============================================================
if HAS_TORCH:
    class SupplyChainMLP(nn.Module):
        """
        Deep MLP with graph-aware features as fallback.
        Uses computed graph topology features alongside supply chain features.
        """
        def __init__(self, in_features, hidden_dim=128):
            super().__init__()
            self.network = nn.Sequential(
                nn.Linear(in_features, hidden_dim),
                nn.BatchNorm1d(hidden_dim),
                nn.ReLU(),
                nn.Dropout(0.3),
                nn.Linear(hidden_dim, hidden_dim // 2),
                nn.BatchNorm1d(hidden_dim // 2),
                nn.ReLU(),
                nn.Dropout(0.2),
                nn.Linear(hidden_dim // 2, hidden_dim // 4),
                nn.ReLU(),
                nn.Linear(hidden_dim // 4, 2),
            )

        def forward(self, x):
            return self.network(x)


def train_gnn_model():
    """Train the GNN model on the graph dataset"""
    print("=" * 60)
    print("  Graph Neural Network — Supply Chain Disruption Predictor")
    print("=" * 60)

    # Load dataset
    data_dir = os.path.join(os.path.dirname(__file__), "datasets")
    graph_csv = os.path.join(data_dir, "supply_chain_graph_dataset.csv")
    base_csv = os.path.join(data_dir, "supply_chain_dataset.csv")

    if os.path.exists(graph_csv):
        df = pd.read_csv(graph_csv)
        print(f"\n📊 Loaded graph dataset: {len(df)} samples")
    elif os.path.exists(base_csv):
        df = pd.read_csv(base_csv)
        print(f"\n📊 Loaded base dataset: {len(df)} samples")
    else:
        print("❌ No dataset found! Run generate_dataset.py first.")
        sys.exit(1)

    feature_cols = ["supplier_reliability", "weather_risk", "port_congestion",
                    "distance", "inventory_level", "geopolitical_risk"]

    graph_feature_cols = [c for c in ["n_suppliers", "n_routes", "avg_path_length",
                                       "clustering_coeff", "graph_density"] if c in df.columns]

    all_features = feature_cols + graph_feature_cols

    print(f"   Features: {all_features}")
    print(f"   Disruption rate: {df['disruption'].mean():.1%}")

    # Split
    train_df, test_df = train_test_split(df, test_size=0.2, random_state=42, stratify=df["disruption"])
    print(f"   Train: {len(train_df)} | Test: {len(test_df)}")

    if HAS_TORCH and HAS_PYG:
        print("\n🧠 Training Graph Neural Network (PyTorch Geometric)...")
        return _train_with_gnn(train_df, test_df, feature_cols, all_features)
    elif HAS_TORCH:
        print("\n🧠 Training Graph-Aware Deep MLP (PyTorch)...")
        print("   (PyTorch Geometric not found — using MLP with graph features)")
        return _train_with_mlp(train_df, test_df, all_features)
    else:
        print("\n🧠 Training XGBoost baseline (PyTorch not found)...")
        return _train_with_xgboost(train_df, test_df, all_features)


def _train_with_gnn(train_df, test_df, feature_cols, all_features):
    """Full GNN training loop"""
    # Build graphs
    print("   Building supply chain graphs...")
    train_graphs = [build_supply_chain_graph(row, feature_cols) for _, row in train_df.iterrows()]
    test_graphs = [build_supply_chain_graph(row, feature_cols) for _, row in test_df.iterrows()]

    in_features = train_graphs[0].x.shape[1]
    model = SupplyChainGNN(in_features=in_features, hidden_dim=64)
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001, weight_decay=1e-4)

    # Class weights for imbalanced data
    n_pos = sum(g.y.item() for g in train_graphs)
    n_neg = len(train_graphs) - n_pos
    weight = torch.tensor([1.0, n_neg / max(n_pos, 1)], dtype=torch.float)
    criterion = nn.CrossEntropyLoss(weight=weight)

    # Training
    n_epochs = 80
    batch_size = 64
    best_acc = 0

    for epoch in range(n_epochs):
        model.train()
        np.random.shuffle(train_graphs)
        total_loss = 0

        for i in range(0, len(train_graphs), batch_size):
            batch_graphs = train_graphs[i:i + batch_size]
            batch = Batch.from_data_list(batch_graphs)

            optimizer.zero_grad()
            out = model(batch)
            loss = criterion(out, batch.y)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()

        if (epoch + 1) % 20 == 0:
            model.eval()
            with torch.no_grad():
                test_batch = Batch.from_data_list(test_graphs)
                test_out = model(test_batch)
                pred = test_out.argmax(dim=1)
                acc = (pred == test_batch.y).float().mean().item()
                if acc > best_acc:
                    best_acc = acc
                print(f"   Epoch {epoch + 1}/{n_epochs} | Loss: {total_loss:.4f} | Test Acc: {acc:.4f}")

    # Final evaluation
    model.eval()
    with torch.no_grad():
        test_batch = Batch.from_data_list(test_graphs)
        test_out = model(test_batch)
        y_pred = test_out.argmax(dim=1).numpy()
        y_proba = F.softmax(test_out, dim=1)[:, 1].numpy()
        y_true = test_batch.y.numpy()

    _print_results(y_true, y_pred, "Graph Neural Network (GCN)")

    # Save model
    model_path = os.path.join(os.path.dirname(__file__), "models", "gnn", "gnn_model.pt")
    torch.save(model.state_dict(), model_path)
    print(f"\n💾 GNN model saved to: {model_path}")

    _save_metadata(y_true, y_pred, "GNN (GCNConv)", all_features, len(train_df) + len(test_df))
    return accuracy_score(y_true, y_pred)


def _train_with_mlp(train_df, test_df, all_features):
    """MLP fallback training"""
    scaler = StandardScaler()
    X_train = scaler.fit_transform(train_df[all_features].values)
    X_test = scaler.transform(test_df[all_features].values)
    y_train = train_df["disruption"].values
    y_test = test_df["disruption"].values

    X_train_t = torch.tensor(X_train, dtype=torch.float32)
    y_train_t = torch.tensor(y_train, dtype=torch.long)
    X_test_t = torch.tensor(X_test, dtype=torch.float32)
    y_test_t = torch.tensor(y_test, dtype=torch.long)

    model = SupplyChainMLP(in_features=len(all_features), hidden_dim=128)
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001, weight_decay=1e-4)

    n_pos = y_train.sum()
    n_neg = len(y_train) - n_pos
    weight = torch.tensor([1.0, n_neg / max(n_pos, 1)], dtype=torch.float)
    criterion = nn.CrossEntropyLoss(weight=weight)

    dataset = TensorDataset(X_train_t, y_train_t)
    loader = DataLoader(dataset, batch_size=64, shuffle=True)

    n_epochs = 100
    for epoch in range(n_epochs):
        model.train()
        total_loss = 0
        for xb, yb in loader:
            optimizer.zero_grad()
            out = model(xb)
            loss = criterion(out, yb)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()

        if (epoch + 1) % 25 == 0:
            model.eval()
            with torch.no_grad():
                pred = model(X_test_t).argmax(dim=1)
                acc = (pred == y_test_t).float().mean().item()
                print(f"   Epoch {epoch + 1}/{n_epochs} | Loss: {total_loss:.4f} | Test Acc: {acc:.4f}")

    model.eval()
    with torch.no_grad():
        y_pred = model(X_test_t).argmax(dim=1).numpy()

    _print_results(y_test, y_pred, "Graph-Aware Deep MLP")

    model_path = os.path.join(os.path.dirname(__file__), "models", "gnn", "gnn_model.pt")
    torch.save({"model_state": model.state_dict(), "scaler_mean": scaler.mean_.tolist(),
                "scaler_scale": scaler.scale_.tolist(), "features": all_features}, model_path)
    print(f"\n💾 MLP model saved to: {model_path}")

    _save_metadata(y_test, y_pred, "Deep MLP (graph-aware)", all_features, len(train_df) + len(test_df))
    return accuracy_score(y_test, y_pred)


def _train_with_xgboost(train_df, test_df, all_features):
    """XGBoost baseline fallback"""
    import xgboost as xgb

    X_train = train_df[all_features].values
    X_test = test_df[all_features].values
    y_train = train_df["disruption"].values
    y_test = test_df["disruption"].values

    model = xgb.XGBClassifier(n_estimators=200, max_depth=6, learning_rate=0.1,
                               objective="binary:logistic", eval_metric="logloss",
                               use_label_encoder=False, random_state=42)
    model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=False)

    y_pred = model.predict(X_test)

    _print_results(y_test, y_pred, "XGBoost Baseline (graph features)")

    model.save_model(os.path.join(os.path.dirname(__file__), "models", "disruption", "disruption_model.json"))
    print(f"\n💾 XGBoost model saved")

    # Feature importance
    importance = model.feature_importances_
    print(f"\n🏆 Feature Importance:")
    for feat, imp in sorted(zip(all_features, importance), key=lambda x: -x[1]):
        bar = "█" * int(imp * 50)
        print(f"   {feat:25s} {imp:.4f} {bar}")

    _save_metadata(y_test, y_pred, "XGBoost", all_features, len(train_df) + len(test_df))
    return accuracy_score(y_test, y_pred)


def _print_results(y_true, y_pred, model_name):
    """Print evaluation metrics"""
    acc = accuracy_score(y_true, y_pred)
    cm = confusion_matrix(y_true, y_pred)

    print(f"\n✅ {model_name} Accuracy: {acc:.4f}")
    print(f"\n📋 Classification Report:")
    print(classification_report(y_true, y_pred, target_names=["Safe", "Disrupted"]))
    print(f"📊 Confusion Matrix:")
    print(f"   Predicted:  Safe  Disrupted")
    print(f"   Actual Safe:     {cm[0][0]:4d}    {cm[0][1]:4d}")
    print(f"   Actual Disrupted:{cm[1][0]:4d}    {cm[1][1]:4d}")


def _save_metadata(y_true, y_pred, model_type, features, n_samples):
    """Save model metadata"""
    metadata = {
        "model_type": model_type,
        "features": features,
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "n_samples": n_samples,
        "n_features": len(features),
        "has_graph_features": any("graph" in f or "cluster" in f or "n_suppliers" in f for f in features),
    }
    meta_path = os.path.join(os.path.dirname(__file__), "models", "metadata", "model_metadata.json")
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"📝 Metadata saved to: {meta_path}")


if __name__ == "__main__":
    train_gnn_model()
