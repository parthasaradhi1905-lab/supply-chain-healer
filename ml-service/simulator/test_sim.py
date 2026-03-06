from supply_chain_sim import SupplyChainSim

def main():
    print("Initializing Supply Chain Simulator...")
    sim = SupplyChainSim()
    
    print("Testing initial steps...")
    for i in range(1, 6):
        state = sim.step()
        print(f"step {i}")
        print(f"inventory {state['inventory']}")
    
    print("\nApplying action 1 (Emergency Order +200)...")
    sim.apply_action(1)
    state = sim.step()
    print("step 6")
    print(f"inventory {state['inventory']} (expected roughly +200)")

    print("\nRunning broader test to trigger disruptions...")
    for i in range(7, 20):
        state = sim.step()
    
    print(f"Final state at step 20: {state}")
    print("Simulator test completed successfully.")

if __name__ == "__main__":
    main()
