import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

import gymnasium as gym
import numpy as np
import torch
import os
from gymnasium.spaces import Box, Discrete
from neo4j import GraphDatabase

from simulation.engine import SupplyChainSimulation


class Neo4jClient:
    def __init__(self):
        # We use Neo4j to pull snapshots of the digital twin
        self.driver = GraphDatabase.driver(
            "bolt://localhost:7687",
            auth=("neo4j", "password")
        )

    def get_graph_snapshot(self):
        query = """
        MATCH (p:Port)
        RETURN p.port_id AS id,
               p.congestion AS congestion,
               p.queue AS queue,
               p.capacity_utilization AS util
        LIMIT 1
        """
        with self.driver.session() as session:
            try:
                result = session.run(query)
                records = [dict(r) for r in result]
                if records:
                    # Provide defaults for potentially missing fields based on the query schema
                    record = records[0]
                    return {
                        "congestion": record.get("congestion", 0.0),
                        "queue": record.get("queue", 0.0),
                        "util": record.get("util", 0.0),
                    }
                else:
                    return {"congestion": 0.0, "queue": 0.0, "util": 0.0}
            except Exception as e:
                # Fallback for when Neo4j isn't properly running yet for parallel workers
                return {"congestion": 0.0, "queue": 0.0, "util": 0.0}


class RiskEmbedding:
    def __init__(self):
        # We load the GNN model exported from the previous step
        # Assuming the model outputs a 16-D embedding
        try:
            model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "models", "gnn", "gnn_model.pt"))
            self.model = torch.load(model_path)
            self.model.eval()
            self.has_model = True
        except Exception as e:
            # Fallback when the model file is not available in test
            self.has_model = False
            self.embedding_dim = 16

    def predict_embedding(self, features):
        if self.has_model:
            with torch.no_grad():
                x = torch.tensor(features).float()
                # Dummy inference path if the loaded PyTorch Graph model accepts raw tensor
                # We handle the fallback gracefully if it requires custom batch format
                try:
                    if hasattr(self.model, 'encode'):
                        embedding = self.model.encode(x)
                    else:
                        embedding = self.model(x)  # direct call
                    return embedding.numpy().flatten()[:16] # extract leading dimensions or whatever shape
                except:
                    return np.zeros(16)
        else:
            return np.random.random(self.embedding_dim)


def build_state_vector(graph_data, gnn_embedding):
    """
    Combines the Neo4j base features + GNN embeddings
    """
    base_features = [
        float(graph_data.get("congestion", 0.0)),
        float(graph_data.get("queue", 0.0)),
        float(graph_data.get("util", 0.0)),
    ]
    state = base_features + list(gnn_embedding)
    return np.array(state, dtype=np.float32)


class SupplyChainEnv(gym.Env):
    """
    Gym wrapper around the SimPy SupplyChainSimulation, enhanced with GNN and Neo4j.
    """

    def __init__(self, config):
        super(SupplyChainEnv, self).__init__()
        self.config = config

        self.neo4j = Neo4jClient()
        self.gnn = RiskEmbedding()

        # create simulation
        self.sim = SupplyChainSimulation()
        for port in config["ports"]:
            self.sim.add_port(port["name"], port["capacity"])

        # State vector: 3 base features + 16 embedding features = 19
        self.state_dim = 19
        self.observation_space = Box(
            low=-np.inf,
            high=np.inf,
            shape=(self.state_dim,),
            dtype=np.float32
        )

        # Actions
        self.action_space = Discrete(5)

        self.state = None
        self.time_limit = config.get("time_limit", 720)

    def reset(self, *, seed=None, options=None):
        if seed is not None:
            np.random.seed(seed)
        
        # reset simulator
        self.sim = SupplyChainSimulation()
        for port in self.config["ports"]:
            self.sim.add_port(port["name"], port["capacity"])

        # Load graph and embedding
        graph_data = self.neo4j.get_graph_snapshot()
        features = np.random.random(10) # Temporary numerical input for GNN model forward pass 
        embedding = self.gnn.predict_embedding(features)
        
        self.state = build_state_vector(graph_data, embedding)
        return self.state, {}

    def step(self, action):
        action = self._validate_action(action)
        self._apply_action(action)

        self.sim.env.run(until=self.sim.env.now + 1)

        # Update environment telemetry context
        graph_data = self.neo4j.get_graph_snapshot()
        features = np.random.random(10)
        embedding = self.gnn.predict_embedding(features)
        self.state = build_state_vector(graph_data, embedding)

        reward = self._compute_reward()
        done = self.sim.env.now >= self.time_limit
        truncated = False

        return self.state, reward, done, truncated, {}

    def _compute_reward(self):
        cost = np.random.random()
        delay = np.random.random()
        reliability = np.random.random()

        # Weighted business objective function
        reward = (
            -0.4 * cost
            -0.4 * delay
            +0.2 * reliability
        )
        return float(reward)

    def _apply_action(self, action):
        pass

    def _validate_action(self, action):
        if action == 2 and np.random.random() < 0.3:
            action = 1
        return action

