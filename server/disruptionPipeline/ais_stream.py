import json
import os
import websocket
import redis
import time
import uuid
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# --- Config ---
AIS_MODE = os.getenv("AIS_MODE", "dev") # "live" or "dev"
AIS_API_KEY = os.getenv("AIS_API_KEY", "")

# We only track a small geographical bounding box (e.g., around Singapore) to avoid massive data overwhelming local testing
BOUNDING_BOX = [[0.5, 102.5], [1.5, 104.5]] 
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# --- Redis Streaming setup ---
r = redis.from_url(REDIS_URL, decode_responses=True)
STREAM_NAME = "stream:ais.telemetry"

try:
    r.xgroup_create(STREAM_NAME, "port_analyzer", id="0", mkstream=True)
    print(f"✅ Redis Stream/Group init: {STREAM_NAME} -> port_analyzer")
except redis.exceptions.ResponseError:
    print(f"ℹ️ Redis group port_analyzer already exists on {STREAM_NAME}")


def build_event_envelope(event_type, source, payload):
    return {
        "event_id": str(uuid.uuid4()),
        "correlation_id": None,
        "event_type": event_type,
        "source": source,
        "version": "1.0",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "payload": payload
    }


def publish_event(payload):
    envelope = build_event_envelope("ais.telemetry", "ais_stream_service", payload)
    
    # Redis XADD requires a dict of strings. We serialize the envelope as a JSON string under a 'data' key
    r.xadd(STREAM_NAME, {"data": json.dumps(envelope)}, maxlen=1000000)
    print(f"📡 Emitted: MMSI {payload['mmsi']} | {payload['speed']} knots @ [{payload['lat']:.4f}, {payload['lon']:.4f}]")


# ==========================================
# MODE 1: LIVE AIS WEBSOCKET
# ==========================================
def on_message(ws, message):
    data = json.loads(message)
    msg_type = data.get("MessageType")
    
    if msg_type == "PositionReport":
        msg = data.get("Message", {}).get("PositionReport", {})
        mmsi = data.get("MetaData", {}).get("MMSI")
        
        payload = {
            "mmsi": mmsi,
            "lat": msg.get("Latitude"),
            "lon": msg.get("Longitude"),
            "speed": msg.get("Sog", 0),  # Speed over ground
            "course": msg.get("Cog", 0), # Course over ground
            "heading": msg.get("TrueHeading", 0),
            "nav_status": msg.get("NavigationalStatus", "unknown"),
            "ship_type": "unknown", # Needs a separate ShipStaticData message
            "destination": "unknown"
        }
        publish_event(payload)


def on_error(ws, error):
    print("❌ WebSocket Error:", error)

def on_close(ws, close_status_code, close_msg):
    print("🔒 WebSocket Closed")

def on_open(ws):
    print(f"🔓 Connected to AISStream.io (Monitoring box: {BOUNDING_BOX})")
    sub_msg = {
        "APIKey": AIS_API_KEY,
        "BoundingBoxes": [BOUNDING_BOX]
    }
    ws.send(json.dumps(sub_msg))

def run_live():
    if not AIS_API_KEY:
        print("❌ Error: AIS_MODE=live but AIS_API_KEY is missing.")
        return
        
    print(f"🚀 Starting LIVE AIS Stream using key starting with {AIS_API_KEY[:5]}...")
    websocket.enableTrace(False)
    ws = websocket.WebSocketApp(
        "wss://stream.aisstream.io/v0/stream",
        on_message=on_message,
        on_error=on_error,
        on_close=on_close,
    )
    ws.on_open = on_open
    ws.run_forever()


# ==========================================
# MODE 2: DEV MOCK STREAM
# ==========================================
def run_mock():
    print("🛠️ Starting MOCK AIS Stream (Dev Mode)...")
    import random
    
    # Singapore bounds for realistic mocks
    lat_min, lat_max = 1.15, 1.35
    lon_min, lon_max = 103.50, 104.10
    
    fleet = [int(f"636018{i:03d}") for i in range(15)]
    
    try:
        while True:
            mmsi = random.choice(fleet)
            payload = {
                "mmsi": mmsi,
                "lat": round(random.uniform(lat_min, lat_max), 4),
                "lon": round(random.uniform(lon_min, lon_max), 4),
                "speed": round(random.uniform(0.0, 18.5), 1),
                "course": round(random.uniform(0, 360), 1),
                "heading": round(random.uniform(0, 360), 1),
                "ship_type": random.choice(["cargo", "tanker", "passenger"]),
                "nav_status": random.choice(["under_way", "moored", "at_anchor"]),
                "destination": random.choice(["Singapore", "Shanghai", "Rotterdam"])
            }
            publish_event(payload)
            time.sleep(random.uniform(0.5, 2.5))
    except KeyboardInterrupt:
        print("Stopped.")


# ==========================================
# ENTRY POINT
# ==========================================
if __name__ == "__main__":
    if REDIS_URL == "redis://localhost:6379":
        # Check if Redis is actually up to avoid spamming errors
        try:
            r.ping()
        except redis.ConnectionError:
            print("❌ Error: Could not connect to Redis. Is Aegis Redis running? (docker compose up)")
            exit(1)

    if AIS_MODE == "live":
        run_live()
    else:
        run_mock()
