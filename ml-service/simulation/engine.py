import simpy
import random


class Ship:
    def __init__(self, env, ship_id, origin, destination, port_network):
        self.env = env
        self.ship_id = ship_id
        self.origin = origin
        self.destination = destination
        self.port_network = port_network
        self.process = env.process(self.travel())

    def travel(self):
        # stochastic travel time (days)
        travel_time = max(random.gauss(15, 3), 5)
        yield self.env.timeout(travel_time)
        print(f"{self.env.now:.2f}: Ship {self.ship_id} arrived at {self.destination.name}")
        yield self.env.process(self.destination.unload(self))


class Port:
    def __init__(self, env, name, capacity):
        self.env = env
        self.name = name
        self.capacity = capacity
        # berths act as queue
        self.berths = simpy.Resource(env, capacity=capacity)
        self.queue = []

    def unload(self, ship):
        arrival_time = self.env.now
        print(f"{arrival_time:.2f}: Ship {ship.ship_id} requesting berth at {self.name}")
        
        with self.berths.request() as request:
            yield request
            wait_time = self.env.now - arrival_time
            print(f"{self.env.now:.2f}: Ship {ship.ship_id} docked at {self.name} after waiting {wait_time:.2f}")
            
            # stochastic unloading time
            unload_time = max(random.gauss(4, 1), 1)
            yield self.env.timeout(unload_time)
            print(f"{self.env.now:.2f}: Ship {ship.ship_id} finished unloading at {self.name}")


class SupplyChainSimulation:
    def __init__(self):
        self.env = simpy.Environment()
        self.ports = {}
        self.ships = []

    def add_port(self, name, capacity):
        port = Port(self.env, name, capacity)
        self.ports[name] = port
        return port

    def add_ship(self, ship_id, origin, destination):
        ship = Ship(
            self.env,
            ship_id,
            self.ports[origin],
            self.ports[destination],
            self.ports
        )
        self.ships.append(ship)

    def generate_random_ships(self):
        ship_id = 0
        while True:
            origin = random.choice(list(self.ports.keys()))
            destination = random.choice(list(self.ports.keys()))
            
            if origin != destination:
                self.add_ship(ship_id, origin, destination)
                print(f"{self.env.now:.2f}: Ship {ship_id} departed {origin}")
                ship_id += 1
                
            # ships appear randomly
            interarrival = random.expovariate(1 / 5)
            yield self.env.timeout(interarrival)

    def run(self, until=100):
        self.env.process(self.generate_random_ships())
        self.env.run(until=until)

if __name__ == "__main__":
    sim = SupplyChainSimulation()
    sim.add_port("Singapore", capacity=3)
    sim.add_port("Shanghai", capacity=2)
    sim.add_port("LosAngeles", capacity=4)
    sim.run(until=200)
