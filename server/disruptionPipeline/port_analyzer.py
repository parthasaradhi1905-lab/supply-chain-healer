import json
import os
import redis
import time
import uuid
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
r = redis.from_url(REDIS_URL, decode_responses=True)

# Stream Config
IN_STREAM = "stream:ais.telemetry"
OUT_STREAM = "stream:port.congestion"
GROUP = "port_analyzer"
CONSUMER = f"analyzer_{uuid.uuid4().hex[:6]}"

# Port Geofences (Simplified lat/lon targeting Singapore for demo)
PORTS = {
    "SGSIN": {"name": "Singapore", "lat": 1.25, "lon": 103.75, "threshold": 10} 
}

# Ensure streams and groups exist
try:
    r.xgroup_create(IN_STREAM, GROUP, id="0", mkstream=True)
except redis.exceptions.ResponseError:
    pass

try:
    r.xgroup_create(OUT_STREAM, "sentinel_port", id="0", mkstream=True)
except redis.exceptions.ResponseError:
    pass

def build_envelope(event_type, source, payload, correlation_id):
    return {
        "event_id": str(uuid.uuid4()),
        "correlation_id": correlation_id,
        "event_type": event_type,
        "source": source,
        "version": "1.0",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "payload": payload
    }

def process_ais_event(envelope):
    payload = envelope.get("payload", {})
    lat = payload.get("lat")
    lon = payload.get("lon")
    
    if lat is None or lon is None:
        return
        
    # Naive Euclidean distance check for "Singapore" geofence
    # In production use Haversine or Neo4j spatial queries
    port = PORTS["SGSIN"]
    dist = ((lat - port["lat"])**2 + (lon - port["lon"])**2)**0.5
    
    if dist < 0.15: # Roughly 15km bounding box
        # Register vessel in a Redis set to count unique ships
        r.sadd("port_density:SGSIN", payload["mmsi"])

def emit_congestion_metrics():
    """Runs periodically to aggregate density and emit congestion events"""
    vessels = r.scard("port_density:SGSIN")
    port = PORTS["SGSIN"]
    
    level = "LOW"
    if vessels > port["threshold"] * 1.5:
        level = "CRITICAL"
    elif vessels > port["threshold"]:
        level = "HIGH"
    elif vessels > port["threshold"] * 0.5:
        level = "MEDIUM"
        
    payload = {
        "port_id": "SGSIN",
        "port_name": port["name"],
        "vessel_count_20km": vessels,
        "queue_length": max(0, vessels - port["threshold"]),
        "median_wait_time_hours": vessels * 1.5, # Mock heuristic
        "congestion_level": level
    }
    
    # We use the port_id as the faux correlation ID since this is an aggregate event
    env = build_envelope("port.congestion_update", "port_analyzer", payload, f"agg_{int(time.time())}")
    r.xadd(OUT_STREAM, {"data": json.dumps(env)}, maxlen=500000)
    
    print(f"📊 [Aggregate] {port['name']} | Ships: {vessels} | Level: {level}")
    
    # Clear density set for next window
    r.delete("port_density:SGSIN")

def run():
    print(f"🚢 Port Congestion Analyzer Started [{CONSUMER}]")
    print(f"   Listening on: {IN_STREAM} (Group: {GROUP})")
    
    last_aggregate_time = time.time()
    
    while True:
        try:
            # Poll for new messages, blocking for 2000ms
            messages = r.xreadgroup(
                groupname=GROUP,
                consumername=CONSUMER,
                streams={IN_STREAM: ">"},
                count=50,
                block=2000
            )
            
            if messages:
                for stream, events in messages:
                    for event_id, data in events:
                        env = json.loads(data["data"])
                        process_ais_event(env)
                        
                        # Crucial step: Acknowledge the message so it leaves the PEL!
                        r.xack(IN_STREAM, GROUP, event_id)
            
            # Run aggregation every 10 seconds
            now = time.time()
            if now - last_aggregate_time > 10:
                emit_congestion_metrics()
                last_aggregate_time = now
                
        except KeyboardInterrupt:
            print("Stopping...")
            break
        except Exception as e:
            import traceback
            print(f"❌ Worker Error: {e}")
            traceback.print_exc()
            time.sleep(2)

if __name__ == "__main__":
    run()
