import WebSocket from 'ws';
import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

const redis = new Redis();
const AIS_API_KEY = process.env.AIS_API_KEY;

export function startAISTracker() {
    if (!AIS_API_KEY) {
        console.warn("[AISTracker] Processing without AIS_API_KEY - tracker is skipped. Use Mock logistics.");
        return;
    }

    const ws = new WebSocket("wss://stream.aisstream.io/v0/stream");

    ws.on("open", () => {
        console.log("[AISTracker] Connected to live maritime stream");

        ws.send(JSON.stringify({
            APIKey: AIS_API_KEY,
            // Track entire globe or specific bounding boxes
            BoundingBoxes: [[[-90, -180], [90, 180]]],
            FiltersShipMMSI: [],
            FilterMessageTypes: ["PositionReport"]
        }));
    });

    ws.on("message", async (data) => {
        try {
            const ship = JSON.parse(data);

            if (ship.MessageType === "PositionReport") {
                const report = ship.Message.PositionReport;

                // Publish live coordinates for Globe tracking
                await redis.publish(
                    "stream:shipments:live",
                    JSON.stringify({
                        mmsi: ship.MetaData.MMSI,
                        name: ship.MetaData.ShipName || 'Unknown Vessel',
                        lat: report.Latitude,
                        lng: report.Longitude,
                        speed: report.Sog,     // Speed over ground
                        status: report.NavigationalStatus
                    })
                );

                // Publish metric to feature store
                // E.g. ship density calculation or anchored status
                if (report.Sog < 0.5) { // Effectively stopped
                    await redis.xadd(
                        "stream:signals:ais",
                        "*",
                        "mmsi", ship.MetaData.MMSI.toString(),
                        "lat", report.Latitude.toString(),
                        "lng", report.Longitude.toString(),
                        "status", "anchored_or_congested"
                    );
                }
            }
        } catch (err) {
            // Silence parse errors on heavy stream
        }
    });

    ws.on("error", (err) => {
        console.error("[AISTracker] Stream error:", err.message);
    });
}
