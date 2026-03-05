/**
 * Disruption Pipeline Cron Scheduler
 * Runs every 30 minutes to fetch global disruption events
 * Stores results in the SQLite events table
 */

import cron from 'node-cron';
import { fetchDisruptions } from './pipeline.js';

let lastFetchedEvents = [];
let isRunning = false;

/**
 * Process and store fetched disruption events
 */
async function processFetchedEvents(events) {
    lastFetchedEvents = events;

    // Store in DB if available
    try {
        const { default: db } = await import('../db/init.js');
        const database = db.getDatabase ? db.getDatabase() : null;

        if (database) {
            const stmt = database.prepare(`
                INSERT OR IGNORE INTO events (
                    source_type, title, description, category, severity,
                    location_country, location_city, location_latitude, location_longitude,
                    confidence, source_url
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            events.forEach(event => {
                try {
                    stmt.run(
                        event.type?.toUpperCase() === 'WEATHER' ? 'WEATHER' : 'NEWS',
                        event.title,
                        event.description || '',
                        event.category || 'LOGISTICS',
                        event.severity?.toUpperCase() || 'MEDIUM',
                        event.location?.country || '',
                        event.location?.city || '',
                        event.location?.lat || null,
                        event.location?.lng || null,
                        0.8,
                        event.url || ''
                    );
                } catch {
                    // duplicate or constraint violation — skip
                }
            });
            stmt.finalize();
            console.log(`[Cron] Stored ${events.length} events in database`);
        }
    } catch {
        console.log('[Cron] DB storage skipped (not initialized)');
    }
}

/**
 * Manual trigger — fetch disruptions on demand
 */
export async function triggerFetch() {
    if (isRunning) return lastFetchedEvents;
    isRunning = true;
    try {
        const events = await fetchDisruptions();
        await processFetchedEvents(events);
        return events;
    } finally {
        isRunning = false;
    }
}

/**
 * Get the most recently fetched events (cached)
 */
export function getLastEvents() {
    return lastFetchedEvents;
}

/**
 * Start the cron scheduler
 */
export function startCron() {
    console.log('[Cron] Disruption pipeline scheduler started (every 30 min)');

    // Run immediately on startup
    triggerFetch().catch(err => {
        console.error('[Cron] Initial fetch failed:', err.message);
    });

    // Schedule recurring runs
    cron.schedule('*/30 * * * *', async () => {
        console.log(`[Cron] Running scheduled disruption fetch at ${new Date().toISOString()}`);
        try {
            await triggerFetch();
        } catch (err) {
            console.error('[Cron] Scheduled fetch failed:', err.message);
        }
    });
}
