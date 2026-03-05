import Redis from 'ioredis';

const redis = new Redis();

/**
 * FeatureStore aggregates chaotic raw signals (News, AIS, Internal Logistics) 
 * into unified, stabilized Node-level Features for the Temporal GNN to digest.
 */
export class FeatureStore {

    // Periodically runs to flush raw streams and compile standard features
    static async aggregateFeatures() {
        try {
            // Concept: Read recent stream signals, group by geographic location
            // and emit a standard FeatureVector dictionary per node.

            // In a production environment this would consume Redis Streams using XREADGROUP.
            // For now, we mock the buffering aggregation interval.

            const featureVector = {
                "Shanghai": {
                    ship_density: Math.random() * 0.8 + 0.2,
                    news_risk: 0.1,
                    weather_risk: Math.random() > 0.9 ? 0.8 : 0.05,
                    port_congestion: Math.random() * 0.5,
                    timestamp: new Date().toISOString()
                },
                "Taiwan": {
                    ship_density: 0.1,
                    news_risk: Math.random() > 0.8 ? 0.9 : 0.2,
                    weather_risk: 0.1,
                    port_congestion: 0.1,
                    timestamp: new Date().toISOString()
                },
                "Singapore": {
                    ship_density: 0.9,
                    news_risk: 0.05,
                    weather_risk: Math.random() > 0.7 ? 0.75 : 0.1,
                    port_congestion: 0.6,
                    timestamp: new Date().toISOString()
                },
                "Rotterdam": {
                    ship_density: 0.6,
                    news_risk: 0.1,
                    weather_risk: 0.2,
                    port_congestion: 0.4,
                    timestamp: new Date().toISOString()
                }
            };

            // Push structured temporal features into the GNN ingestion stream
            for (const [node, metrics] of Object.entries(featureVector)) {
                await redis.xadd(
                    "stream:ml:features",
                    "*",
                    "node", node,
                    "ship_density", metrics.ship_density.toString(),
                    "news_risk", metrics.news_risk.toString(),
                    "weather_risk", metrics.weather_risk.toString(),
                    "port_congestion", metrics.port_congestion.toString(),
                    "timestamp", metrics.timestamp
                );
            }

            console.log(`[FeatureStore] Aggregated and published ${Object.keys(featureVector).length} node feature vectors.`);
        } catch (err) {
            console.error("[FeatureStore] Error aggregating features:", err);
        }
    }

    static startLoop() {
        console.log("[FeatureStore] Started aggregation loop");
        setInterval(() => {
            this.aggregateFeatures();
        }, 30000); // Buffer and aggregate every 30 seconds
    }
}
