import gym
import numpy as np
import torch
from simulator.supply_chain_sim import SupplyChainSim

class GraphSupplyChainEnv(gym.Env):
    def __init__(self, gnn_model):
        self.sim = SupplyChainSim()
        self.gnn = gnn_model
        
        # 0: do nothing, 1: emergency order, 2: reroute shipment, 3: increase port capacity
        self.action_space = gym.spaces.Discrete(4)
        
        # Suppose the hidden_dim of GNN wrapper is 128
        self.embedding_dim = 128
        self.observation_space = gym.spaces.Box(
            low=-np.inf,
            high=np.inf,
            shape=(self.embedding_dim,),
            dtype=np.float32
        )

    def reset(self):
        self.sim = SupplyChainSim()
        state = self.sim.step()
        return self._get_graph_embedding(state)

    def step(self, action):
        self.sim.apply_action(action)
        state = self.sim.step()
        
        reward = self._reward(state)
        done = state["inventory"] <= 0
        
        obs = self._get_graph_embedding(state)
        return obs, reward, done, {}

    def _get_graph_embedding(self, state):
        # Create a mock graph based on state variables to emulate the neo4j digital twin extract
        # A real implementation would query Neo4j -> FeatureStore -> get tensors
        # Nodes: 4 (Supplier, Port, Shipment, Factory)
        # Let's map state properties to 6 basic features per node for emulation
        num_nodes = 4
        in_features = 6
        
        x = torch.zeros((num_nodes, in_features), dtype=torch.float)
        
        # Add basic feature representations for the dynamic state
        x[0, 0] = state.get("disruptions", 0) # supplier disruption count
        x[1, 1] = self.sim.port_capacity    # port capacity
        x[2, 2] = state.get("delay", 0)       # shipment delay
        x[3, 3] = state.get("inventory", 0)   # factory inventory
        
        # Simple linear chain graph
        edge_index = torch.tensor([
            [0, 1, 2],
            [1, 2, 3]
        ], dtype=torch.long)
        
        # Convert bidirectional
        edge_index = torch.cat([edge_index, edge_index.flip(0)], dim=1)

        embedding = self.gnn(x, edge_index)
        return embedding.detach().numpy()

    def _reward(self, state):
        return (
            state["inventory"] * 0.01
            - state["delay"] * 2
            - state["disruptions"] * 1
        )
