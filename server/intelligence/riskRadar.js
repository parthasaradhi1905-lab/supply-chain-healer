import { readStreamGroup, ackStreamMessage, createConsumerGroup } from '../swarm/MemoryBus.js';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

const redis = new Redis();

class GlobalRiskRadar {
    constructor() {
        this.name = 'RISK_RADAR';
        this.consumerId = `radar_${uuidv4().substring(0, 8)}`;
        this.isRunning = false;
        this.nodeRisks = new Map();
    }

    /**
     * Start continuous polling of predictive risks to compile the Global Radar
     */
    async startRadar() {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log(`[${this.name}] 🌐 Starting Global Risk Radar Aggregator...`);
        // Ensure consumer group for predictions exists
        await createConsumerGroup('stream:predictions', 'radar_group');

        // Emit radar state periodically to WebSocket
        this.radarInterval = setInterval(() => this.publishRadar(), 5000);

        while (this.isRunning) {
            try {
                const results = await readStreamGroup('stream:predictions', 'radar_group', this.consumerId, 50, 2000);

                if (!results) {
                    await this.delay(2000);
                    continue;
                }

                if (results.length > 0) {
                    for (const streamData of results) {
                        for (const message of streamData.messages) {
                            const { id, message: msgData } = message;

                            if (msgData) {
                                this.updateRadarNode(msgData);
                            }

                            // Acknowledge the message
                            await ackStreamMessage('stream:predictions', 'radar_group', id);
                        }
                    }
                }
            } catch (error) {
                console.error(`[${this.name}] ❌ Stream Error:`, error.message);
                await this.delay(2000);
            }
        }
    }

    updateRadarNode(payload) {
        const risk = parseFloat(payload.risk_score);
        const node = payload.node;
        const conf = parseFloat(payload.confidence);
        const window = payload.time_window;

        // Composite risk score: heavily weight the raw predictive risk, penalize low confidence
        let radarScore = risk * (0.7 + (conf * 0.3));

        this.nodeRisks.set(node, {
            name: node,
            risk: radarScore,
            confidence: conf,
            window: window,
            last_updated: Date.now()
        });
    }

    async publishRadar() {
        if (this.nodeRisks.size === 0) return;

        // 1. Filter stale predictions (older than 5 minutes)
        const now = Date.now();
        for (const [node, data] of this.nodeRisks.entries()) {
            if (now - data.last_updated > 300000) {
                this.nodeRisks.delete(node);
            }
        }

        // 2. Rank nodes by highest risk
        const rankedNodes = Array.from(this.nodeRisks.values())
            .sort((a, b) => b.risk - a.risk)
            .slice(0, 10); // Top 10 most fragile nodes globally

        if (rankedNodes.length > 0) {
            // 3. Publish to PubSub for the WebSocket to consume
            await redis.publish(
                "stream:risk_radar",
                JSON.stringify({ ranked: rankedNodes })
            );
        }
    }

    stopRadar() {
        this.isRunning = false;
        clearInterval(this.radarInterval);
        console.log(`[${this.name}] 🌐 Stopping Risk Radar.`);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export default new GlobalRiskRadar();
