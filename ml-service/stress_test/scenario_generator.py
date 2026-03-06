import random

DISRUPTIONS = [
    "port_congestion",
    "supplier_failure",
    "shipment_delay",
    "hurricane",
    "strike"
]

def generate_scenario():
    scenario = {
        "disruption": random.choice(DISRUPTIONS),
        "severity": random.uniform(0.2, 1.0),
        "location": random.choice([
            "Shanghai",
            "Singapore",
            "Rotterdam",
            "Los Angeles"
        ])
    }
    return scenario
