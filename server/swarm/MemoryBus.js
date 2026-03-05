/**
 * MemoryBus — Shared event bus for the agent swarm
 * 
 * Channels:
 *   tasks    — task assignments from Planner to Workers
 *   results  — task results from Workers to Evaluator
 *   logs     — audit trail of all agent decisions
 * 
 * Supports Redis pub/sub when available, falls back to in-memory EventEmitter
 */

import { EventEmitter } from 'events';

let redisClient = null;
let useRedis = false;

// In-memory fallback
const emitter = new EventEmitter();
emitter.setMaxListeners(50);

// Shared memory store (for agent state)
const sharedMemory = new Map();

/**
 * Initialize Redis connection (optional)
 */
export async function initRedis() {
    try {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        const { createClient } = await import('redis');
        let errorLogged = false;

        redisClient = createClient({
            url: redisUrl,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 1) return false; // Stop retrying after 1 attempt
                    return 500;
                },
            },
        });

        redisClient.on('error', (err) => {
            if (!errorLogged) {
                console.log('[MemoryBus] Redis unavailable, using in-memory fallback');
                errorLogged = true;
            }
            useRedis = false;
        });

        await redisClient.connect();
        useRedis = true;
        console.log('[MemoryBus] Connected to Redis');
    } catch (err) {
        console.log('[MemoryBus] Redis not available, using in-memory event bus');
        useRedis = false;
    }
}

/**
 * Publish a message to a channel
 * @param {string} channel - 'tasks' | 'results' | 'logs'
 * @param {object} data - Message payload
 */
export async function publish(channel, data) {
    const message = JSON.stringify({
        ...data,
        timestamp: new Date().toISOString(),
        channel,
    });

    if (useRedis && redisClient) {
        try {
            await redisClient.publish(channel, message);
        } catch {
            emitter.emit(channel, message);
        }
    } else {
        emitter.emit(channel, message);
    }
}

/**
 * Subscribe to a channel
 * @param {string} channel - Channel name
 * @param {function} callback - Handler (receives parsed data)
 */
export async function subscribe(channel, callback) {
    if (useRedis && redisClient) {
        try {
            const subscriber = redisClient.duplicate();
            await subscriber.connect();
            await subscriber.subscribe(channel, (message) => {
                try {
                    callback(JSON.parse(message));
                } catch (e) {
                    callback(message);
                }
            });
            return subscriber;
        } catch {
            // Fall through to in-memory
        }
    }

    // In-memory fallback
    const handler = (message) => {
        try {
            callback(JSON.parse(message));
        } catch {
            callback(message);
        }
    };
    emitter.on(channel, handler);
    return { unsubscribe: () => emitter.off(channel, handler) };
}

/**
 * Set shared memory value (agent state)
 */
export function setMemory(key, value) {
    sharedMemory.set(key, value);
    if (useRedis && redisClient) {
        redisClient.set(`swarm:${key}`, JSON.stringify(value)).catch(() => { });
    }
}

/**
 * Get shared memory value
 */
export async function getMemory(key) {
    if (useRedis && redisClient) {
        try {
            const val = await redisClient.get(`swarm:${key}`);
            if (val) return JSON.parse(val);
        } catch {
            // fall through
        }
    }
    return sharedMemory.get(key);
}

/**
 * Get all memory entries
 */
export function getAllMemory() {
    return Object.fromEntries(sharedMemory);
}

/**
 * Clear shared memory
 */
export function clearMemory() {
    sharedMemory.clear();
}

/**
 * Add a message to a Redis Stream with a MAXLEN trim policy
 */
export async function streamAdd(stream, payload, maxLen = 500000) {
    if (useRedis && redisClient) {
        try {
            await redisClient.xAdd(stream, '*', { data: JSON.stringify(payload) }, {
                TRIM: {
                    strategy: 'MAXLEN',
                    strategyModifier: '~',
                    threshold: maxLen
                }
            });
        } catch (e) {
            console.error(`[MemoryBus] XADD Failed for ${stream}:`, e.message);
        }
    }
}

/**
 * Create a consumer group for a stream
 */
export async function createConsumerGroup(stream, group) {
    if (useRedis && redisClient) {
        try {
            await redisClient.xGroupCreate(stream, group, '0', { MKSTREAM: true });
        } catch (e) {
            // Ignore if group already exists
        }
    }
}

/**
 * Read messages from a Redis Stream using a Consumer Group
 */
export async function readStreamGroup(stream, group, consumer, count = 10, block = 2000) {
    if (useRedis && redisClient) {
        try {
            const results = await redisClient.xReadGroup(
                group,
                consumer,
                [{ key: stream, id: '>' }],
                { COUNT: count, BLOCK: block }
            );
            return results; // [{ name: stream, messages: [{ id, message: { data } }] }]
        } catch (e) {
            if (!e.message.includes('NOGROUP')) {
                console.error(`[MemoryBus] XREADGROUP Error for ${stream}:`, e.message);
            }
            return null;
        }
    }
    return null;
}

/**
 * Acknowledge a message in a consumer group
 */
export async function ackStreamMessage(stream, group, messageId) {
    if (useRedis && redisClient) {
        try {
            await redisClient.xAck(stream, group, messageId);
        } catch (e) {
            console.error(`[MemoryBus] XACK Failed for ${stream}:`, e.message);
        }
    }
}

export default {
    initRedis,
    publish,
    subscribe,
    setMemory,
    getMemory,
    getAllMemory,
    clearMemory,
    streamAdd,
    createConsumerGroup,
    readStreamGroup,
    ackStreamMessage,
};
