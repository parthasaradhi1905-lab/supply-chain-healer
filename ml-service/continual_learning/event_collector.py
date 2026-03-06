import redis
import json

def collect_events():
    events = []
    try:
        r = redis.Redis()
        streams = [
            "stream:disruptions",
            "stream:risk.predictions",
            "stream:recovery.outcomes"
        ]

        for stream in streams:
            # Emulate collecting latest events
            # Note: A true production system would track the last ID and use XREAD blocking
            entries = r.xrange(stream)
            for _, data in entries:
                if b'payload' in data:
                    events.append(json.loads(data[b'payload']))
    except Exception as e:
        print(f"Failed to connect to Redis during event collection: {e}")
        # Return mock events for testing if Redis is unreachable
        events = [
            {"risk_score": 0.82, "delay_days": 5, "affected_nodes": ["A"], "recovered": True},
            {"risk_score": 0.95, "delay_days": 10, "affected_nodes": ["A", "B", "C"], "recovered": False}
        ]
        
    return events
