/**
 * Disruption Data Pipeline
 * Fetches real-time disruption events from multiple global sources
 * Falls back to realistic mock data when API keys are unavailable
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const NEWSAPI_KEY = process.env.NEWSAPI_KEY || '';

/**
 * Fetch disruption events from NewsAPI
 */
async function fetchFromNewsAPI() {
    if (!NEWSAPI_KEY) return [];

    try {
        const res = await axios.get('https://newsapi.org/v2/everything', {
            params: {
                q: '(port OR shipping OR "supply chain" OR logistics) AND (delay OR blockage OR strike OR hurricane OR disruption)',
                sortBy: 'publishedAt',
                pageSize: 20,
                apiKey: NEWSAPI_KEY,
                language: 'en',
            },
            timeout: 10000,
        });

        return (res.data.articles || []).map(a => ({
            type: 'news',
            title: a.title,
            description: a.description || '',
            source: a.source?.name || 'Unknown',
            url: a.url,
            time: a.publishedAt,
            severity: classifySeverity(a.title + ' ' + (a.description || '')),
            category: classifyCategory(a.title + ' ' + (a.description || '')),
        }));
    } catch (err) {
        console.error('[Pipeline] NewsAPI fetch failed:', err.message);
        return [];
    }
}

/**
 * Generate realistic mock disruption events when APIs are unavailable
 */
function getMockDisruptions() {
    const now = new Date();
    const scenarios = [
        {
            type: 'weather',
            title: 'Typhoon Mawar Approaches South China Sea — Port Delays Expected',
            description: 'Category 4 typhoon tracking toward Guangdong province. Port Shenzhen and Hong Kong may suspend operations for 48 hours.',
            source: 'NOAA Weather Service',
            severity: 'critical',
            category: 'NATURAL_DISASTER',
            location: { country: 'China', city: 'Shenzhen', lat: 22.54, lng: 114.06 },
        },
        {
            type: 'geopolitical',
            title: 'Panama Canal Water Levels Drop — Transit Restrictions Tightened',
            description: 'Drought conditions reduce daily vessel transits from 36 to 24. Waiting times extend to 21 days.',
            source: 'Reuters',
            severity: 'high',
            category: 'INFRASTRUCTURE',
            location: { country: 'Panama', city: 'Panama City', lat: 9.00, lng: -79.5 },
        },
        {
            type: 'labor',
            title: 'German Rail Workers Announce 48-Hour Strike',
            description: 'Deutsche Bahn freight services halted across Western Europe. Intermodal shipments delayed.',
            source: 'DW News',
            severity: 'medium',
            category: 'LABOR',
            location: { country: 'Germany', city: 'Berlin', lat: 52.52, lng: 13.41 },
        },
        {
            type: 'news',
            title: 'Red Sea Shipping Under Threat — Houthi Attacks on Commercial Vessels',
            description: 'Major shipping lines rerouting via Cape of Good Hope. Transit times increase 10-14 days for Asia-Europe trade.',
            source: 'Lloyd\'s List',
            severity: 'critical',
            category: 'GEOPOLITICAL',
            location: { country: 'Yemen', city: 'Aden', lat: 12.78, lng: 45.03 },
        },
        {
            type: 'weather',
            title: 'Winter Storm Disrupts US East Coast Port Operations',
            description: 'Ports of New York, Newark, and Baltimore operating at reduced capacity. Container dwell times increased.',
            source: 'Port Authority',
            severity: 'medium',
            category: 'NATURAL_DISASTER',
            location: { country: 'USA', city: 'New York', lat: 40.71, lng: -74.01 },
        },
        {
            type: 'news',
            title: 'Semiconductor Shortage Impacts Auto Supply Chain',
            description: 'TSMC reports 3-week production delay. Automotive suppliers adjusting delivery schedules.',
            source: 'Nikkei Asia',
            severity: 'high',
            category: 'LOGISTICS',
            location: { country: 'Taiwan', city: 'Hsinchu', lat: 24.80, lng: 120.97 },
        },
        {
            type: 'geopolitical',
            title: 'EU Imposes New Tariffs on Chinese EV Components',
            description: 'Import duties raised to 48%. Supply chain restructuring expected for European automakers.',
            source: 'Financial Times',
            severity: 'medium',
            category: 'GEOPOLITICAL',
            location: { country: 'Belgium', city: 'Brussels', lat: 50.85, lng: 4.35 },
        },
    ];

    // Return 3-5 random scenarios with current timestamps
    const count = 3 + Math.floor(Math.random() * 3);
    const shuffled = scenarios.sort(() => Math.random() - 0.5).slice(0, count);

    return shuffled.map((s, i) => ({
        ...s,
        time: new Date(now.getTime() - i * 3600000).toISOString(),
        url: '',
    }));
}

/**
 * Classify severity from text content
 */
function classifySeverity(text) {
    const lower = text.toLowerCase();
    if (lower.includes('critical') || lower.includes('blockage') || lower.includes('hurricane') || lower.includes('typhoon')) {
        return 'critical';
    }
    if (lower.includes('strike') || lower.includes('delay') || lower.includes('shortage') || lower.includes('reroute')) {
        return 'high';
    }
    if (lower.includes('congestion') || lower.includes('warning') || lower.includes('reduced')) {
        return 'medium';
    }
    return 'low';
}

/**
 * Classify disruption category from text
 */
function classifyCategory(text) {
    const lower = text.toLowerCase();
    if (lower.includes('hurricane') || lower.includes('typhoon') || lower.includes('storm') || lower.includes('earthquake')) return 'NATURAL_DISASTER';
    if (lower.includes('strike') || lower.includes('labor') || lower.includes('protest')) return 'LABOR';
    if (lower.includes('port') || lower.includes('canal') || lower.includes('infrastructure')) return 'INFRASTRUCTURE';
    if (lower.includes('tariff') || lower.includes('sanction') || lower.includes('war') || lower.includes('geopolitic')) return 'GEOPOLITICAL';
    return 'LOGISTICS';
}

/**
 * Main pipeline: fetch from all sources and merge
 */
export async function fetchDisruptions() {
    const sources = await Promise.allSettled([
        fetchFromNewsAPI(),
    ]);

    let events = [];
    sources.forEach(result => {
        if (result.status === 'fulfilled' && result.value.length > 0) {
            events.push(...result.value);
        }
    });

    // If no real data, use mock
    if (events.length === 0) {
        console.log('[Pipeline] No live sources available — using mock disruption data');
        events = getMockDisruptions();
    }

    // Deduplicate by title
    const seen = new Set();
    events = events.filter(e => {
        const key = e.title.substring(0, 50);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    console.log(`[Pipeline] Fetched ${events.length} disruption events`);
    return events;
}

export { getMockDisruptions, classifySeverity, classifyCategory };
