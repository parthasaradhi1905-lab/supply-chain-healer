import simpy
import random

class SupplyChainSim:
    def __init__(self):
        self.env = simpy.Environment()

        # System state
        self.inventory = 1000
        self.delay = 0
        self.shipments_in_transit = 0

        # Ports
        self.port_capacity = 2
        self.port = simpy.Resource(self.env, capacity=self.port_capacity)

        # Metrics
        self.disruptions = 0

        # Processes
        self.env.process(self.factory())
        self.env.process(self.generate_shipments())
        self.env.process(self.random_disruptions())

    # ------------------------------
    # FACTORY CONSUMPTION PROCESS
    # ------------------------------
    def factory(self):
        while True:
            yield self.env.timeout(1)
            consumption = random.randint(8,12)
            self.inventory -= consumption
            if self.inventory < 0:
                self.inventory = 0

    # ------------------------------
    # SHIPMENT GENERATION
    # ------------------------------
    def generate_shipments(self):
        shipment_id = 0
        while True:
            yield self.env.timeout(random.randint(5,8))
            shipment_id += 1
            self.shipments_in_transit += 1
            self.env.process(self.shipment_process(shipment_id))

    # ------------------------------
    # SHIPMENT PROCESS
    # ------------------------------
    def shipment_process(self, shipment_id):
        with self.port.request() as req:
            yield req
            port_time = random.uniform(1,3)
            yield self.env.timeout(port_time)

        travel_time = random.uniform(5,10)
        yield self.env.timeout(travel_time)

        delivered = random.randint(80,120)
        self.inventory += delivered
        self.shipments_in_transit -= 1

    # ------------------------------
    # RANDOM DISRUPTIONS
    # ------------------------------
    def random_disruptions(self):
        while True:
            yield self.env.timeout(random.randint(15,25))
            event = random.choice([
                "port_congestion",
                "shipment_delay",
                "supplier_failure"
            ])

            self.disruptions += 1
            if event == "port_congestion":
                self.port_capacity = max(1, self.port_capacity - 1)
                self.port = simpy.Resource(self.env, capacity=self.port_capacity)
                print(f"[DISRUPTION] Port congestion! capacity={self.port_capacity}")
            elif event == "shipment_delay":
                delay = random.randint(2,5)
                self.delay += delay
                print(f"[DISRUPTION] Shipment delay +{delay}")
            elif event == "supplier_failure":
                lost = random.randint(50,150)
                self.inventory = max(0, self.inventory - lost)
                print(f"[DISRUPTION] Supplier failure lost={lost}")

    # ------------------------------
    # ACTIONS FROM RL AGENT
    # ------------------------------
    def apply_action(self, action):
        if action == 0:
            # do nothing
            pass
        elif action == 1:
            # emergency order
            self.inventory += 200
        elif action == 2:
            # reroute shipment
            self.delay = max(0, self.delay - 2)
        elif action == 3:
            # increase port capacity
            self.port_capacity += 1
            self.port = simpy.Resource(self.env, capacity=self.port_capacity)

    # ------------------------------
    # STEP SIMULATION
    # ------------------------------
    def step(self):
        self.env.run(until=self.env.now + 1)
        state = {
            "inventory": self.inventory,
            "delay": self.delay,
            "shipments": self.shipments_in_transit,
            "disruptions": self.disruptions
        }
        return state

    def reset(self):
        self.__init__()
        return self.step()
