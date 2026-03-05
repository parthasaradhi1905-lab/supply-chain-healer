import { readStreamGroup, ackStreamMessage, streamAdd, createConsumerGroup } from '../../swarm/MemoryBus.js';
import { v4 as uuidv4 } from 'uuid';

class SentinelAgent {
    constructor() {
        this.name = 'SENTINEL';
        this.consumerId = `sentinel_${uuidv4().substring(0, 8)}`;
        this.isRunning = false;

        // Ensure the consumer group exists
        createConsumerGroup('stream:predictions', 'sentinel_predictions');
    }

    /**
     * Start continuous polling of the predictive risk stream
     */
    async startListening() {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log(`[${this.name}] 🛡️ Starting Sentinel Predictive Listener [${this.consumerId}]...`);

        while (this.isRunning) {
            try {
                // Poll stream:predictions
                const results = await readStreamGroup('stream:predictions', 'sentinel_predictions', this.consumerId, 10, 5000);

                if (results && results.length > 0) {
                    for (const streamData of results) {
                        for (const message of streamData.messages) {
                            const { id, message: msgData } = message;

                            if (msgData) {
                                await this.processPrediction(msgData);
                            }

                            // Acknowledge the message
                            await ackStreamMessage('stream:predictions', 'sentinel_predictions', id);
                        }
                    }
                }
            } catch (error) {
                console.error(`[${this.name}] ❌ Stream Error:`, error.message);
                await this.delay(2000);
            }
        }
    }

    /**
     * Process an incoming predictive risk forecast and trigger Preemptive Swarm Strategies
     */
    async processPrediction(payload) {
        const risk = parseFloat(payload.risk_score);
        const conf = parseFloat(payload.confidence);
        const node = payload.node;
        const window = payload.time_window;

        // Preemptive Trigger Logic: High risk AND high confidence
        if (risk > 0.70 && conf > 0.60) {
            console.log(`[${this.name}] 🔮 PREDICTED RISK: ${risk.toFixed(2)} at ${node} (Confidence: ${conf.toFixed(2)})`);

            const disruption = {
                type: 'PREDICTED_RISK',
                title: `Emerging Threat Foreseen at ${node}`,
                severity: 'high',
                affected_nodes: [node],
                affected_routes: [`Routes via ${node}`],
                affected_transport_modes: ['sea', 'air'],
                probability: risk,
                forecast_window: window,
                impact_description: `Temporal GNN predicts severe delays arriving in ${window} with ${Math.round(conf * 100)}% confidence.`,
            };

            // 1. Emit the standardized verified disruption event to trigger proactive planning
            const outputEnvelope = {
                event_id: `pred_${uuidv4().substring(0, 8)}`,
                correlation_id: `fcst_${Date.now()}`,
                event_type: 'disruption.predicted',
                source: 'sentinel_agent',
                version: '2.0',
                timestamp: new Date().toISOString(),
                payload: disruption
            };

            await streamAdd('stream:disruptions', outputEnvelope);
            console.log(`[${this.name}] 📢 Emitted preemptive mitigation trigger to stream:disruptions`);
            console.log(`[${this.name}] ⏳ Waiting for Agent Orchestrator to mount pre-emptive response...`);
        }
    }

    /**
     * Stop polling
     */
    stopListening() {
        this.isRunning = false;
        console.log(`[${this.name}] 🛡️ Stopping Sentinel Listener.`);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export default new SentinelAgent();
