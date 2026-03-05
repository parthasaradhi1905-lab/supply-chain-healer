import Redis from "ioredis";
const redis = new Redis();

// Initial state of active shipments with geographical coordinates
export const shipments = [
    {
        id: "SHIP-001",
        route_name: "Shanghai → Singapore",
        type: "ship",
        startLat: 31.23,
        startLng: 121.47,
        endLat: 1.35,
        endLng: 103.82,
        progress: 0.1,
        status: "moving"
    },
    {
        id: "SHIP-002",
        route_name: "Singapore → Detroit",
        type: "plane",
        startLat: 1.35,
        startLng: 103.82,
        endLat: 42.33,
        endLng: -83.04,
        progress: 0.8,
        status: "moving"
    },
    {
        id: "SHIP-003",
        route_name: "Rotterdam → New York",
        type: "ship",
        startLat: 51.92,
        startLng: 4.47,
        endLat: 40.71,
        endLng: -74.00,
        progress: 0.4,
        status: "moving"
    }
];

let simSpeed = 1;

export function startSimulation() {
    console.log("[LogisticsEngine] Starting geographical movement simulation...");
    setInterval(() => {
        shipments.forEach(s => {
            if (s.status === "moving") {
                // Progress increments based on speed multiplier
                s.progress += (0.005 * simSpeed);
                if (s.progress > 1) {
                    s.progress = 1;
                    s.status = "delivered";
                }
            }
        });

        // Broadcast current global logistics state to the UI
        redis.publish(
            "stream:shipments",
            JSON.stringify(shipments)
        );
    }, 1000);
}

export function setSimulationSpeed(speed) {
    simSpeed = parseFloat(speed);
    console.log(`[LogisticsEngine] Simulation speed set to ${simSpeed}x`);
}

export function rerouteShipment(id, newRoute) {
    const shipment = shipments.find(s => s.id === id);
    if (shipment) {
        shipment.startLat = newRoute.startLat;
        shipment.startLng = newRoute.startLng;
        shipment.endLat = newRoute.endLat;
        shipment.endLng = newRoute.endLng;
        shipment.progress = 0; // reset progress on new route
        shipment.status = "rerouted";
        shipment.route_name = newRoute.name || "Rerouted";
        console.log(`[LogisticsEngine] Shipment ${id} rerouted to ${shipment.route_name}`);
    }
}

export function pauseShipmentsNear(locationKeywords) {
    shipments.forEach(s => {
        if (s.route_name.toLowerCase().includes(locationKeywords.toLowerCase())) {
            s.status = "delayed";
        }
    });
}
