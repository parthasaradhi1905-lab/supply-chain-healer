import os
import ray
import numpy as np
from ray.rllib.algorithms.ppo import PPOConfig
from ray.tune.registry import register_env

# Ensure parent path is resolving correctly when Ray workers spawn
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from rl.env.multi_agent_env import SupplyChainMultiEnv

def env_creator(config):
    return SupplyChainMultiEnv(config)

if __name__ == "__main__":
    # ------------------------------------------------
    # Initialize Ray
    # ------------------------------------------------
    ray.init()

    # ------------------------------------------------
    # Register Environment
    # ------------------------------------------------
    register_env("SupplyChainMultiEnv", env_creator)

    # ------------------------------------------------
    # Environment Configuration
    # ------------------------------------------------
    env_config = {
        "ports": [
            {"name": "Singapore", "capacity": 3},
            {"name": "Shanghai", "capacity": 4},
            {"name": "LosAngeles", "capacity": 5},
            {"name": "Rotterdam", "capacity": 4},
        ],
        "time_limit": 720
    }

    # ------------------------------------------------
    # PPO Configuration
    # ------------------------------------------------
    config = (
        PPOConfig()
        .environment(
            env="SupplyChainMultiEnv",
            env_config=env_config
        )
        .env_runners(
            num_env_runners=6,   # parallel simulators
            num_envs_per_env_runner=4,
            rollout_fragment_length=200
        )
        .multi_agent(
            policies={
                "manager",
                "routing",
                "procurement",
                "inventory"
            },
            policy_mapping_fn=lambda agent_id, *args, **kwargs: agent_id
        )
        .training(
            train_batch_size=4000,
            gamma=0.99,
            lr=5e-5,
            model={"fcnet_hiddens": [128, 128]}
        )
        .resources(
            num_gpus=0
        )
    )

    # ------------------------------------------------
    # Build Trainer
    # ------------------------------------------------
    algo = config.build()

    # ------------------------------------------------
    # Training Loop
    # ------------------------------------------------
    for i in range(20):
        result = algo.train()
        
        env_runners_res = result.get('env_runners', {})
        
        # New API stack uses 'episode_return_mean'
        reward_mean = env_runners_res.get('episode_return_mean')
        
        if reward_mean is None or np.isnan(reward_mean):
            reward_mean = result.get('episode_reward_mean', float('nan'))
            
        print(f"Iteration {i} | Reward Mean: {reward_mean:.3f}")

        # save checkpoint periodically
        if i % 20 == 0:
            checkpoint = algo.save()
            print("Checkpoint saved at:", checkpoint)

    # ------------------------------------------------
    # Save Final Model Checkpoint
    # ------------------------------------------------
    checkpoint_dir = os.path.abspath("../checkpoints")
    os.makedirs(checkpoint_dir, exist_ok=True)
    checkpoint = algo.save(checkpoint_dir)
    print("Final policy checkpoint saved to:", checkpoint)

    ray.shutdown()
