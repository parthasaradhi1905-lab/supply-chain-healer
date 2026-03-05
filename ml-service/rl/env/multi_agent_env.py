import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

import numpy as np
import gymnasium as gym
from gymnasium.spaces import Box, Discrete
from ray.rllib.env.multi_agent_env import MultiAgentEnv

from rl.env.environment import Neo4jClient, RiskEmbedding, build_state_vector
from simulation.engine import SupplyChainSimulation

class SupplyChainMultiEnv(MultiAgentEnv):
    """
    Hierarchical Multi-Agent RL Environment wrapping the SimPy 
    simulation and Neo4j Digital Twin.
    """

    def __init__(self, config=None):
        super().__init__()
        self.config = config or {}
        
        self.possible_agents = ["manager", "routing", "procurement", "inventory"]
        self.agents = self.possible_agents.copy()
        
        # Ray specifically checks for _agent_ids
        self._agent_ids = set(self.possible_agents)
        
        self.neo4j = Neo4jClient()
        self.gnn = RiskEmbedding()

        self.sim = SupplyChainSimulation()
        ports = self.config.get("ports", [])
        for port in ports:
            self.sim.add_port(port["name"], port["capacity"])

        self.state_dim = 19
        
        self.observation_space = gym.spaces.Dict({
            agent: Box(low=-np.inf, high=np.inf, shape=(self.state_dim,), dtype=np.float32)
            for agent in self.possible_agents
        })
        
        # Distinct action mapping for hierarchical roles
        self.action_space = gym.spaces.Dict({
            "manager": Discrete(3),      # reroute, increase inventory, change supplier
            "routing": Discrete(4),      # routes, port selection, delays, expedite
            "procurement": Discrete(3),  # supplier select, contract, buy
            "inventory": Discrete(3)     # warehouse capacity, buffer, emergency
        })

        self.time_limit = self.config.get("time_limit", 720)
        self.current_state = None
        self.step_count = 0

    def reset(self, *, seed=None, options=None):
        if seed is not None:
            np.random.seed(seed)
            
        self.agents = self.possible_agents.copy()

        self.sim = SupplyChainSimulation()
        ports = self.config.get("ports", [])
        for port in ports:
            self.sim.add_port(port["name"], port["capacity"])

        graph_data = self.neo4j.get_graph_snapshot()
        features = np.random.random(10) 
        embedding = self.gnn.predict_embedding(features)
        
        self.current_state = build_state_vector(graph_data, embedding)
        self.step_count = 0
        
        obs = {agent: self.current_state for agent in self.possible_agents}
        infos = {agent: {} for agent in self.possible_agents}
        
        return obs, infos

    def step(self, action_dict):
        for agent_id, action in action_dict.items():
            self._apply_action(agent_id, action)

        self.sim.env.run(until=self.sim.env.now + 1)

        graph_data = self.neo4j.get_graph_snapshot()
        features = np.random.random(10)
        embedding = self.gnn.predict_embedding(features)
        self.current_state = build_state_vector(graph_data, embedding)

        obs = {agent: self.current_state for agent in self.agents}
        rewards = {agent: self._compute_reward(agent) for agent in self.agents}
        
        self.step_count += 1
        done = self.step_count >= self.time_limit
        
        terminateds = {agent: done for agent in self.agents}
        truncateds = {agent: False for agent in self.agents}
        infos = {agent: {} for agent in self.agents}
        
        terminateds["__all__"] = done
        truncateds["__all__"] = False
        
        if done:
            self.agents = []

        return obs, rewards, terminateds, truncateds, infos

    def _apply_action(self, agent_id, action):
        pass

    def _compute_reward(self, agent_id):
        return float(np.random.random() * 2 - 1)
