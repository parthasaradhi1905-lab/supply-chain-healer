import { readStreamGroup, ackStreamMessage, createConsumerGroup } from './MemoryBus.js';
import { runSwarm } from './SwarmController.js';
import { v4 as uuidv4 } from 'uuid';

class RiskListener {
    constructor() {
        this.name = 'RISK_LISTENER';
        this.consumerId = `risk_listener_${uuidv4().substring(0, 8)}`;
        this.isRunning = false;
        this.groupName = 'risk_orchestrator';

        // Ensure the consumer group exists
        createConsumerGroup('stream:risk.predictions', this.groupName);
    }

    async start() {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log(`[${this.name}] 🧠 Starting Risk Prediction Listener [${this.consumerId}]...`);

        while (this.isRunning) {
            try {
                const results = await readStreamGroup('stream:risk.predictions', this.groupName, this.consumerId, 5, 5000);

                if (results && results.length > 0) {
                    for (const streamData of results) {
                        for (const message of streamData.messages) {
                            const { id, message: msgData } = message;

                            if (msgData && msgData.data) {
                                const envelope = JSON.parse(msgData.data);
                                await this.handleRiskPrediction(envelope);
                            }

                            await ackStreamMessage('stream:risk.predictions', this.groupName, id);
                        }
                    }
                }
            } catch (error) {
                console.error(`[${this.name}] ❌ Stream Error:`, error.message);
                await this.delay(2000);
            }
        }
    }

    async handleRiskPrediction(envelope) {
        const payload = envelope.payload;

        console.log(`[${this.name}] 🔮 GNN Result Received: Risk Score ${payload.risk_score.toFixed(4)} for ${payload.disruption_type}`);

        // Decide whether to trigger swarm based on risk
        // Threshold: 0.6 (HIGH risk)
        if (payload.risk_score >= 0.6) {
            console.log(`[${this.name}] 🚨 Risk threshold exceeded! Triggering Swarm Orchestration...`);

            // Reconstruct the disruption object for the swarm
            const disruption = {
                type: payload.disruption_type,
                title: `GNN-Verified: ${payload.disruption_type}`,
                severity: payload.risk_score >= 0.8 ? 'critical' : 'high',
                gnn_risk_score: payload.risk_score,
                affected_nodes: payload.affected_nodes || [],
                correlation_id: envelope.correlation_id
            };

            runSwarm(disruption, { source: 'gnn_risk_verified', prediction_id: envelope.event_id })
                .catch(err => console.error(`[${this.name}] ❌ Failed to trigger swarm:`, err.message));
        } else {
            console.log(`[${this.name}] ✅ Risk score ${payload.risk_score.toFixed(4)} is below threshold. Standby.`);
        }
    }

    stop() {
        this.isRunning = false;
        console.log(`[${this.name}] 🧠 Stopping Risk Listener.`);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export default new RiskListener();
