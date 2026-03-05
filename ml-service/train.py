"""
Supply Chain Disruption Prediction — XGBoost Training Script

Features:
    - supplier_reliability (0-1)
    - weather_risk (0-1)
    - port_congestion (0-1)
    - distance (km)
    - inventory_level (0-1)
    - geopolitical_risk (0-1)

Target:
    - disruption (0/1 binary)
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
import xgboost as xgb
import json
import os

def main():
    print("=" * 60)
    print("  Supply Chain Disruption Prediction — Model Training")
    print("=" * 60)

    # Load dataset
    data_path = os.path.join(os.path.dirname(__file__), "data", "supply_chain_dataset.csv")
    data = pd.read_csv(data_path)

    print(f"\n📊 Dataset: {len(data)} samples")
    print(f"   Features: {list(data.columns[:-1])}")
    print(f"   Target: disruption (0=safe, 1=disrupted)")
    print(f"   Class distribution:")
    print(f"     Safe:      {(data['disruption'] == 0).sum()} ({(data['disruption'] == 0).mean():.1%})")
    print(f"     Disrupted: {(data['disruption'] == 1).sum()} ({(data['disruption'] == 1).mean():.1%})")

    # Features and target
    X = data.drop("disruption", axis=1)
    y = data["disruption"]

    # Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"\n🔄 Train/Test split: {len(X_train)} / {len(X_test)}")

    # Train XGBoost
    model = xgb.XGBClassifier(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.1,
        objective="binary:logistic",
        eval_metric="logloss",
        use_label_encoder=False,
        random_state=42,
    )

    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=False,
    )

    # Evaluate
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)

    print(f"\n✅ Model Accuracy: {accuracy:.4f}")
    print(f"\n📋 Classification Report:")
    print(classification_report(y_test, y_pred, target_names=["Safe", "Disrupted"]))

    # Confusion matrix
    cm = confusion_matrix(y_test, y_pred)
    print(f"📊 Confusion Matrix:")
    print(f"   Predicted:  Safe  Disrupted")
    print(f"   Actual Safe:     {cm[0][0]:4d}    {cm[0][1]:4d}")
    print(f"   Actual Disrupted:{cm[1][0]:4d}    {cm[1][1]:4d}")

    # Feature importance
    importance = model.feature_importances_
    features = X.columns.tolist()
    print(f"\n🏆 Feature Importance:")
    for feat, imp in sorted(zip(features, importance), key=lambda x: -x[1]):
        bar = "█" * int(imp * 40)
        print(f"   {feat:25s} {imp:.4f} {bar}")

    # Save model
    model_path = os.path.join(os.path.dirname(__file__), "disruption_model.json")
    model.save_model(model_path)
    print(f"\n💾 Model saved to: {model_path}")

    # Save metadata
    metadata = {
        "model_type": "XGBClassifier",
        "features": features,
        "accuracy": float(accuracy),
        "n_samples": len(data),
        "n_features": len(features),
        "class_distribution": {
            "safe": int((data["disruption"] == 0).sum()),
            "disrupted": int((data["disruption"] == 1).sum()),
        },
        "feature_importance": {f: float(i) for f, i in zip(features, importance)},
    }

    meta_path = os.path.join(os.path.dirname(__file__), "model_metadata.json")
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"📝 Metadata saved to: {meta_path}")

    print("\n" + "=" * 60)
    print("  Training complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
