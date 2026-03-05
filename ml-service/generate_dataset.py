"""
Supply Chain Disruption Dataset Generator
Generates 5000+ realistic supply chain scenarios via Monte Carlo simulation

Scenario dimensions:
    - Supplier profiles (reliability, location, capacity)
    - Weather patterns (seasonal, regional storms)
    - Port congestion (time-varying, event-driven)
    - Geopolitical risk (country-based, trade conflict zones)
    - Distance & transport mode effects
    - Inventory buffers
    - Interaction effects (e.g. low reliability + hurricane = disruption)
"""

import pandas as pd
import numpy as np
import os

np.random.seed(42)

N_SAMPLES = 5200

# --- Supplier profile archetypes ---
SUPPLIER_ARCHETYPES = [
    {"region": "East Asia",    "base_reliability": 0.91, "base_distance": 9000,  "geo_base": 0.25},
    {"region": "South Asia",   "base_reliability": 0.84, "base_distance": 8000,  "geo_base": 0.35},
    {"region": "Europe",       "base_reliability": 0.93, "base_distance": 5000,  "geo_base": 0.15},
    {"region": "Middle East",  "base_reliability": 0.80, "base_distance": 7000,  "geo_base": 0.55},
    {"region": "North America","base_reliability": 0.95, "base_distance": 2000,  "geo_base": 0.10},
    {"region": "South America","base_reliability": 0.82, "base_distance": 6000,  "geo_base": 0.30},
    {"region": "Africa",       "base_reliability": 0.75, "base_distance": 10000, "geo_base": 0.50},
    {"region": "Southeast Asia","base_reliability": 0.87, "base_distance": 8500, "geo_base": 0.30},
]

# --- Seasonal weather risk profiles ---
def seasonal_weather_risk(month, region_idx):
    """Seasonal weather with regional variation"""
    base = 0.15 + 0.25 * np.sin(2 * np.pi * (month - 3) / 12)  # Peak in summer
    regional_offset = [0.1, 0.2, -0.05, 0.15, 0.05, 0.1, 0.25, 0.18][region_idx]
    hurricane_season = 0.3 if 6 <= month <= 11 and region_idx in [0, 1, 4, 7] else 0.0
    return np.clip(base + regional_offset + hurricane_season + np.random.normal(0, 0.08), 0, 1)

# --- Port congestion model ---
def port_congestion(distance, weather_risk, geo_risk):
    """Port congestion rises with distance, bad weather, and geopolitical tension"""
    base = 0.1 + distance / 25000
    weather_effect = weather_risk * 0.35
    geo_effect = geo_risk * 0.25
    noise = np.random.normal(0, 0.06)
    return np.clip(base + weather_effect + geo_effect + noise, 0, 1)

# --- Disruption label logic (realistic, non-trivial) ---
def compute_disruption(row):
    """
    Multi-factor disruption probability with interaction effects.
    Not a simple threshold — models real-world non-linearities.
    """
    r = row["supplier_reliability"]
    w = row["weather_risk"]
    p = row["port_congestion"]
    d = row["distance"]
    inv = row["inventory_level"]
    g = row["geopolitical_risk"]

    # Base risk from individual factors
    risk = (
        (1 - r) * 0.20 +           # Unreliable supplier
        w * 0.18 +                  # Bad weather
        p * 0.15 +                  # Port congestion
        (d / 15000) * 0.10 +        # Long distance
        (1 - inv) * 0.12 +          # Low inventory
        g * 0.15                    # Geopolitical risk
    )

    # Interaction effects (non-linear — key for research quality)
    if w > 0.6 and r < 0.85:       # Storm + unreliable supplier
        risk += 0.15
    if p > 0.7 and d > 8000:       # Congested port + long distance
        risk += 0.12
    if g > 0.6 and inv < 0.4:      # Geopolitical crisis + low buffer
        risk += 0.18
    if w > 0.7 and p > 0.6:        # Storm + congestion (compounding)
        risk += 0.10
    if r > 0.92 and inv > 0.7:     # Reliable + buffered → protective
        risk -= 0.08

    # Add noise to prevent perfect separability
    risk += np.random.normal(0, 0.04)

    # Stochastic threshold
    threshold = 0.42 + np.random.normal(0, 0.03)
    return 1 if risk > threshold else 0

def main():
    print("=" * 60)
    print("  Supply Chain Dataset Generator — 5000+ Samples")
    print("=" * 60)

    rows = []
    for i in range(N_SAMPLES):
        arch_idx = i % len(SUPPLIER_ARCHETYPES)
        arch = SUPPLIER_ARCHETYPES[arch_idx]
        month = (i % 12) + 1

        # Generate features with realistic correlations
        reliability = np.clip(arch["base_reliability"] + np.random.normal(0, 0.06), 0.50, 0.99)
        weather = seasonal_weather_risk(month, arch_idx)
        distance = max(500, arch["base_distance"] + np.random.normal(0, 1500))
        geo = np.clip(arch["geo_base"] + np.random.normal(0, 0.12), 0, 1)
        inventory = np.clip(np.random.beta(2.5, 2.0), 0.05, 0.99)
        congestion = port_congestion(distance, weather, geo)

        rows.append({
            "supplier_reliability": round(reliability, 4),
            "weather_risk":         round(weather, 4),
            "port_congestion":      round(congestion, 4),
            "distance":             round(distance, 0),
            "inventory_level":      round(inventory, 4),
            "geopolitical_risk":    round(geo, 4),
        })

    df = pd.DataFrame(rows)

    # Compute disruption labels
    df["disruption"] = df.apply(compute_disruption, axis=1)

    # Stats
    n_disrupted = df["disruption"].sum()
    n_safe = len(df) - n_disrupted
    ratio = n_disrupted / len(df)

    print(f"\n📊 Generated {len(df)} samples")
    print(f"   Safe:      {n_safe} ({1 - ratio:.1%})")
    print(f"   Disrupted: {n_disrupted} ({ratio:.1%})")
    print(f"\n📈 Feature statistics:")
    print(df.describe().round(3).to_string())

    # Save
    data_dir = os.path.join(os.path.dirname(__file__), "data")
    os.makedirs(data_dir, exist_ok=True)

    csv_path = os.path.join(data_dir, "supply_chain_dataset.csv")
    df.to_csv(csv_path, index=False)
    print(f"\n💾 Saved to: {csv_path}")

    # Also save a graph-ready version with adjacency info
    graph_path = os.path.join(data_dir, "supply_chain_graph_dataset.csv")

    # Generate graph node features (each row = a supply chain scenario graph)
    graph_rows = []
    for i, row in df.iterrows():
        # Add graph structure features: number of suppliers, avg path length, clustering
        n_suppliers = np.random.randint(3, 12)
        n_routes = n_suppliers + np.random.randint(2, 6)
        avg_path_length = 2 + np.random.exponential(1.5)
        clustering_coeff = np.clip(np.random.beta(2, 5), 0.05, 0.8)
        graph_density = n_routes / max(1, n_suppliers * (n_suppliers - 1) / 2)

        graph_rows.append({
            **row.to_dict(),
            "n_suppliers":       n_suppliers,
            "n_routes":          n_routes,
            "avg_path_length":   round(avg_path_length, 3),
            "clustering_coeff":  round(clustering_coeff, 4),
            "graph_density":     round(min(graph_density, 1.0), 4),
        })

    graph_df = pd.DataFrame(graph_rows)
    graph_df.to_csv(graph_path, index=False)
    print(f"📊 Graph dataset saved to: {graph_path}")

    print("\n" + "=" * 60)
    print(f"  Done! {len(df)} base + {len(graph_df)} graph samples generated")
    print("=" * 60)


if __name__ == "__main__":
    main()
