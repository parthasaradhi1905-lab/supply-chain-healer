import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from simulator.supply_chain_sim import SupplyChainSim
from scenario_generator import generate_scenario
from metrics import MetricsCollector

def run_stress_test(n=50):
    metrics = MetricsCollector()

    for i in range(1, n + 1):
        sim = SupplyChainSim()
        scenario = generate_scenario()
        # print(f"Running scenario {i}: {scenario['disruption']} at {scenario['location']}")

        recovery_time = 0
        state = {"inventory": 1000} # default start 

        for step in range(100):
            state = sim.step()
            
            # Simple rules-based reaction for test
            if state["inventory"] < 200:
                sim.apply_action(1)  # emergency order

            recovery_time += 1

        supply_loss = max(0, 1000 - state["inventory"])
        cost = recovery_time * 5
        metrics.record(recovery_time, supply_loss, cost)

    return metrics.summary()

if __name__ == "__main__":
    print("Starting Stress Testing Engine...")
    results = run_stress_test(10)
    print("\n[STRESS TEST RESULTS]")
    print(f"Average recovery time: {results['avg_recovery_time']:.1f}")
    print(f"Average supply loss: {results['avg_supply_loss']:.1f} units")
    print(f"Average cost: ${results['avg_cost']:.1f}")
    print("Engine tests completed.")
