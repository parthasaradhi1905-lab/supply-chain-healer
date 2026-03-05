import redis
import json
import time

r = redis.Redis()

event = {
    "risk_score": 0.85,
    "delay_days": 10,
    "affected_nodes": ["Shanghai", "Singapore"],
    "recovered": True
}

# Add a few events to ensure the dataset has enough samples
for i in range(5):
    event["risk_score"] = 0.80 + (i * 0.02)
    r.xadd(
        "stream:recovery.outcomes",
        {"payload": json.dumps(event)}
    )

print("Mock training events added to Redis stream:recovery.outcomes")
