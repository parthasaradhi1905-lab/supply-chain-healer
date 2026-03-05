import { readStreamGroup, ackStreamMessage, createConsumerGroup } from '../swarm/MemoryBus.js';
import { driver } from './Neo4jClient.js';
import { v4 as uuidv4 } from 'uuid';

class TwinUpdater {
    constructor() {
        this.consumerId = `twin_updater_${uuidv4().substring(0, 8)}`;
        this.isRunning = false;
        this.batch = [];
        this.batchTimer = null;
        this.BATCH_SIZE = 100;
        this.BATCH_TIMEOUT_MS = 2000;

        // Ensure consumer groups exist
        createConsumerGroup('stream:ais.telemetry', 'twin_updater');
        createConsumerGroup('stream:port.congestion', 'twin_updater');
        createConsumerGroup('stream:disruptions', 'twin_updater');
    }

    async start() {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log(`[TwinUpdater] 🌐 Starting Graph Updater [${this.consumerId}]...`);

        // Start the periodic flush timer
        this.batchTimer = setInterval(() => this.flushBatch(), this.BATCH_TIMEOUT_MS);

        // Run the listener loops non-blocking
        this.listenStream('stream:ais.telemetry', this.processAisEvent.bind(this));
        this.listenStream('stream:port.congestion', this.processPortEvent.bind(this));
        this.listenStream('stream:disruptions', this.processDisruptionEvent.bind(this));
    }

    async listenStream(streamName, processFn) {
        while (this.isRunning) {
            try {
                const results = await readStreamGroup(streamName, 'twin_updater', this.consumerId, 50, 5000);

                if (results && results.length > 0) {
                    for (const streamData of results) {
                        for (const message of streamData.messages) {
                            const { id, message: msgData } = message;

                            if (msgData && msgData.data) {
                                const envelope = JSON.parse(msgData.data);
                                processFn(envelope, id, streamName);
                            } else {
                                await ackStreamMessage(streamName, 'twin_updater', id);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error(`[TwinUpdater] ❌ Error reading ${streamName}:`, error.message);
                await this.delay(2000);
            }
        }
    }

    processAisEvent(envelope, messageId, streamName) {
        const payload = envelope.payload;
        if (!payload || !payload.mmsi) {
            this.pushToBatch(null, messageId, streamName);
            return;
        }

        const query = `
            MERGE (s:Ship {mmsi: $mmsi})
            SET s.lat = $lat,
                s.lon = $lon,
                s.speed = $speed,
                s.heading = $course,
                s.destination = $destination,
                s.last_updated = $timestamp
        `;

        // For AIS, we also want to optionally link to a Port if it's close.
        // We handle that logic globally or rely on port_analyzer, but for now just update node state.
        const params = {
            mmsi: payload.mmsi,
            lat: payload.lat,
            lon: payload.lon,
            speed: payload.speed || 0,
            course: payload.course || 0,
            destination: payload.destination || 'Unknown',
            timestamp: envelope.timestamp
        };

        this.pushToBatch({ query, params }, messageId, streamName);
    }

    processPortEvent(envelope, messageId, streamName) {
        const payload = envelope.payload;
        if (!payload || !payload.port_id) {
            this.pushToBatch(null, messageId, streamName);
            return;
        }

        const query = `
            MERGE (p:Port {port_id: $port_id})
            SET p.name = $name,
                p.congestion_level = $level,
                p.queue_length = $queue,
                p.last_updated = $timestamp
        `;

        const params = {
            port_id: payload.port_id,
            name: payload.port_name || payload.port_id,
            level: payload.congestion_level || 'LOW',
            queue: payload.queue_length || 0,
            timestamp: envelope.timestamp
        };

        this.pushToBatch({ query, params }, messageId, streamName);
    }

    processDisruptionEvent(envelope, messageId, streamName) {
        const payload = envelope.payload;
        if (!payload || !envelope.event_id) {
            this.pushToBatch(null, messageId, streamName);
            return;
        }

        // Disruption Event -> AFFECTS -> Port
        const query = `
            MERGE (d:DisruptionEvent {id: $event_id})
            SET d.type = $type,
                d.severity = $severity,
                d.title = $title,
                d.timestamp = $timestamp
            
            // If the payload specifies affected ports (naive string parsing for demo)
            WITH d
            MATCH (p:Port)
            WHERE p.name IN $affected_nodes OR p.port_id IN $affected_nodes OR size($affected_nodes) = 0
            MERGE (d)-[:AFFECTS]->(p)
        `;

        const params = {
            event_id: envelope.event_id,
            type: payload.type || 'UNKNOWN',
            severity: payload.severity || 'low',
            title: payload.title || 'Disruption Event',
            timestamp: envelope.timestamp,
            // Assuming the sentinel outputs affected_nodes as ['Port(Singapore)']
            affected_nodes: (payload.affected_nodes || []).map(n => {
                const match = n.match(/Port\((.*?)\)/);
                return match ? match[1] : n;
            })
        };

        this.pushToBatch({ query, params }, messageId, streamName);
    }

    pushToBatch(graphOp, messageId, streamName) {
        this.batch.push({
            op: graphOp,
            ack: { messageId, streamName }
        });

        if (this.batch.length >= this.BATCH_SIZE) {
            this.flushBatch();
        }
    }

    async flushBatch() {
        if (this.batch.length === 0) return;

        // Copy array to allow immediate reuse of this.batch
        const currentBatch = [...this.batch];
        this.batch = [];

        const session = driver.session();
        try {
            await session.executeWrite(async (tx) => {
                for (const item of currentBatch) {
                    if (item.op) {
                        await tx.run(item.op.query, item.op.params);
                    }
                }
            });

            // Once transaction succeeds, acknowledge all messages in Redis
            for (const item of currentBatch) {
                await ackStreamMessage(item.ack.streamName, 'twin_updater', item.ack.messageId);
            }

            console.log(`[TwinUpdater] ⚡ Flushed ${currentBatch.length} updates to Neo4j`);
        } catch (error) {
            console.error('[TwinUpdater] ❌ Failed to flush batch to Neo4j:', error.message);
            // On failure, re-add to batch (or implement dead-letter queue)
            // For now, naive retry by pushing back to array
            this.batch.push(...currentBatch);
        } finally {
            await session.close();
        }
    }

    stop() {
        this.isRunning = false;
        if (this.batchTimer) {
            clearInterval(this.batchTimer);
            this.batchTimer = null;
        }
        this.flushBatch();
        console.log(`[TwinUpdater] 🌐 Stopped Graph Updater.`);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export default new TwinUpdater();
