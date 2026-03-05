import torch
import os
import json
from neo4j import GraphDatabase
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

NEO4J_URI = os.getenv('NEO4J_URI', 'bolt://localhost:7687')
NEO4J_USER = os.getenv('NEO4J_USER', 'neo4j')
NEO4J_PASSWORD = os.getenv('NEO4J_PASSWORD', 'password')

driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

# Define node type mapping (same as train_gnn.py)
# 0: supplier, 1: port, 2: factory, 3: warehouse, 4: retailer
NODE_TYPE_MAP = {
    'Supplier': 0,
    'Port': 1,
    'Factory': 2,
    'Warehouse': 3,
    'Retailer': 4,
    'Ship': 1 # Map ships to port-like for now if needed, or expand types
}

def extract_features():
    """
    Queries Neo4j and extracts graph features into PyTorch tensors.
    """
    print(f"[FeatureExtractor] 🔍 Connecting to Neo4j at {NEO4J_URI}...")
    
    with driver.session() as session:
        # 1. Fetch all nodes
        node_query = "MATCH (n) RETURN id(n) as id, labels(n) as labels, properties(n) as props"
        nodes_res = session.run(node_query)
        
        nodes = []
        node_id_map = {} # Neo4j ID -> Tensor Index
        
        for i, record in enumerate(nodes_res):
            node_id = record["id"]
            labels = record["labels"]
            props = record["props"]
            
            node_id_map[node_id] = i
            
            # Feature engineering (11 features total: 6 base + 5 one-hot)
            # base: [reliability, weather, congestion, distance, inventory, geo]
            # default/mock values for now
            reliability = props.get('reliability', 0.9)
            weather = props.get('weather_risk', 0.1)
            congestion = props.get('congestion_level', 0)
            if isinstance(congestion, str):
                congestion = 1 if congestion == 'MED' else (2 if congestion == 'HIGH' else 0)
            
            distance = props.get('distance', 1000) / 10000.0 # Normalize roughly
            inventory = props.get('inventory_level', 0.5)
            geo = props.get('geopolitical_risk', 0.05)
            
            base_features = [reliability, weather, congestion, distance, inventory, geo]
            
            # One-hot node type
            type_vec = [0, 0, 0, 0, 0]
            for label in labels:
                if label in NODE_TYPE_MAP:
                    type_vec[NODE_TYPE_MAP[label]] = 1
                    break
            
            nodes.append(base_features + type_vec)
            
        x = torch.tensor(nodes, dtype=torch.float)
        
        # 2. Fetch all edges
        edge_query = "MATCH (n)-[r]->(m) RETURN id(n) as source, id(m) as target"
        edges_res = session.run(edge_query)
        
        edge_index_list = []
        for record in edges_res:
            source = record["source"]
            target = record["target"]
            
            if source in node_id_map and target in node_id_map:
                edge_index_list.append([node_id_map[source], node_id_map[target]])
                # Add reverse edges for undirected GCN
                edge_index_list.append([node_id_map[target], node_id_map[source]])
        
        if not edge_index_list:
            # Fallback for empty graph/no edges
            edge_index = torch.empty((2, 0), dtype=torch.long)
        else:
            edge_index = torch.tensor(edge_index_list, dtype=torch.long).t().contiguous()
            
        # 3. Save to disk (Feature Store)
        data_dir = os.path.join(os.path.dirname(__file__), "data", "features")
        os.makedirs(data_dir, exist_ok=True)
        
        torch.save(x, os.path.join(data_dir, "x.pt"))
        torch.save(edge_index, os.path.join(data_dir, "edge_index.pt"))
        
        # Save node_id_map for lookup in predictor
        with open(os.path.join(data_dir, "node_map.json"), "w") as f:
            json.dump({str(k): v for k, v in node_id_map.items()}, f)
            
        print(f"[FeatureExtractor] ✅ Successfully extracted {len(nodes)} nodes and {len(edge_index_list)//2} edges.")
        return x, edge_index

if __name__ == "__main__":
    extract_features()
    driver.close()
