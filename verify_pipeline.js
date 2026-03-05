import { streamAdd } from './server/swarm/MemoryBus.js';
import { v4 as uuidv4 } from 'uuid';

async function triggerTest() {
    const eventId = `test_${uuidv4().substring(0, 8)}`;

    const congestionEvent = {
        event_id: eventId,
        correlation_id: `corr_${uuidv4().substring(0, 8)}`,
        event_type: 'port.congestion',
        source: 'manual_verification_script',
        version: '1.0',
        timestamp: new Date().toISOString(),
        payload: {
            port_id: 'SGSIN',
            port_name: 'Singapore',
            vessel_count: 82,
            queue_length: 35,
            median_wait_time_hours: 28.5,
            congestion_level: 'HIGH',
            last_updated: new Date().toISOString()
        }
    };

    console.log(`[TEST] 🚀 Injecting HIGH congestion event for Singapore into stream:port.congestion...`);
    await streamAdd('stream:port.congestion', congestionEvent);
    console.log(`[TEST] ✅ Event injected. Monitoring pipeline logs...`);

    // Stop after injection
    process.exit(0);
}

triggerTest().catch(err => {
    console.error('[TEST] ❌ Injection failed:', err.message);
    process.exit(1);
});
