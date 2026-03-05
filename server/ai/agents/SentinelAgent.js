import { readStreamGroup, ackStreamMessage, streamAdd, createConsumerGroup } from '../../swarm/MemoryBus.js';
import { v4 as uuidv4 } from 'uuid';

class SentinelAgent {
    constructor() {
        this.name = 'SENTINEL';
        this.consumerId = `sentinel_${uuidv4().substring(0, 8)}`;
        this.isRunning = false;

        // Ensure the consumer group exists
        createConsumerGroup('stream:port.congestion', 'sentinel_port');
    }

    /**
     * Start continuous polling of the port.congestion stream
     */
    async startListening() {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log(`[${this.name}] 🛡️ Starting Sentinel Stream Listener [${this.consumerId}]...`);

        while (this.isRunning) {
            try {
                // Poll stream:port.congestion
                const results = await readStreamGroup('stream:port.congestion', 'sentinel_port', this.consumerId, 10, 5000);

                if (results && results.length > 0) {
                    for (const streamData of results) {
                        for (const message of streamData.messages) {
                            const { id, message: msgData } = message;

                            if (msgData && msgData.data) {
                                const envelope = JSON.parse(msgData.data);
                                await this.processCongestionEvent(envelope);
                            }

                            // Acknowledge the message
                            await ackStreamMessage('stream:port.congestion', 'sentinel_port', id);
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
     * Process an incoming congestion event and decide if it escalates to a full Swarm Disruption
     */
    async processCongestionEvent(envelope) {
        const payload = envelope.payload;

        // We only escalate if congestion is HIGH or CRITICAL
        if (payload.congestion_level !== 'HIGH' && payload.congestion_level !== 'CRITICAL') {
            return;
        }

        console.log(`[${this.name}] ⚠️ DETECTED: ${payload.congestion_level} congestion at ${payload.port_name}`);

        const disruption = {
            type: 'PORT_CONGESTION',
            title: `Severe Congestion at ${payload.port_name} Port`,
            severity: payload.congestion_level.toLowerCase(),
            affected_nodes: [`Port(${payload.port_name})`],
            affected_routes: [`${payload.port_name} Routes`],
            affected_transport_modes: ['sea'],
            probability: 0.95,
            impact_description: `Vessel wait time increased to ${payload.median_wait_time_hours} hours due to ${payload.queue_length} ships queued.`,
        };

        // 1. Emit the standardized verified disruption event
        const outputEnvelope = {
            event_id: `ds_${uuidv4().substring(0, 8)}`,
            correlation_id: envelope.event_id,
            event_type: 'disruption.detected',
            source: 'sentinel_agent',
            version: '1.0',
            timestamp: new Date().toISOString(),
            payload: disruption
        };

        await streamAdd('stream:disruptions', outputEnvelope);
        console.log(`[${this.name}] 📢 Emitted verified disruption event to stream:disruptions`);
        console.log(`[${this.name}] ⏳ Waiting for GNN Risk Predictor to evaluate...`);
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
