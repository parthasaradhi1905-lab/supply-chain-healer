import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

const redis = new Redis();

/**
 * StormTracker simulates and tracks global cyclone objects.
 * Storms move across the globe and project a 'disruption radius' 
 * that intersects with supply chain nodes.
 */
class StormTracker {
    constructor() {
        this.storms = [
            {
                id: uuidv4(),
                name: "Typhoon Aegis",
                lat: 15.0,
                lng: 135.0,
                wind_speed: 120, // km/h
                radius: 400, // km
                movement: { dLat: 0.05, dLng: -0.1 }, // Moving NW
                severity: 0.85
            }
        ];
        this.interval = null;
    }

    // Kinematic update of storm positions
    updatePositions() {
        this.storms.forEach(storm => {
            storm.lat += storm.movement.dLat;
            storm.lng += storm.movement.dLng;

            // Simple boundary resetting for simulation continuity
            if (storm.lat > 60 || storm.lat < -60) storm.movement.dLat *= -1;
            if (storm.lng > 180) storm.lng = -180;
            if (storm.lng < -180) storm.lng = 180;
        });

        this.broadcastStorms();
    }

    async broadcastStorms() {
        // Broadcast to WebSocket for real-time visualization
        await redis.publish("stream:storms", JSON.stringify(this.storms));

        // Generate risk signals if storms are near key nodes
        this.checkProximityToNodes();
    }

    async checkProximityToNodes() {
        // Simplified check — if we had the Neo4j node list here we would use it.
        // For now, we emit a general storm signal.
        for (const storm of this.storms) {
            await redis.xadd(
                "stream:signals",
                "*",
                "type", "storm",
                "name", storm.name,
                "lat", storm.lat.toString(),
                "lng", storm.lng.toString(),
                "severity", storm.severity.toString()
            );
        }
    }

    start() {
        console.log("🌀 Storm Tracker Active...");
        this.interval = setInterval(() => {
            this.updatePositions();
        }, 10000); // Update every 10 seconds for visual flow
    }

    stop() {
        if (this.interval) clearInterval(this.interval);
    }
}

export default new StormTracker();
