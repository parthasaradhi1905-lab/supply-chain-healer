/**
 * News Agent - Supply Chain Disruption News Monitor
 * 
 * Monitors news sources for logistics disruption events.
 * In simulation mode, generates realistic synthetic events for testing.
 */

// Simulated news events for testing
const SIMULATED_NEWS_EVENTS = [
    {
        title: "Major Port Congestion at Singapore",
        description: "Container ship backlog at Port of Singapore reaches 3-day delays. Shipping companies report significant disruptions to Asia-Pacific routes.",
        category: "LOGISTICS",
        severity: "HIGH",
        location: { country: "Singapore", city: "Singapore", latitude: 1.29, longitude: 103.85 },
        keywords: ["port congestion", "shipping delay", "container backlog", "singapore"]
    },
    {
        title: "Rotterdam Port Workers Announce Strike",
        description: "Dock workers at Europe's largest port announce 48-hour strike starting Monday. Expected to impact EU supply chains significantly.",
        category: "LABOR",
        severity: "HIGH",
        location: { country: "Netherlands", city: "Rotterdam", latitude: 51.92, longitude: 4.48 },
        keywords: ["port strike", "labor dispute", "rotterdam", "supply chain disruption"]
    },
    {
        title: "Suez Canal Traffic Resumes After Vessel Breakdown",
        description: "Container vessel engine failure caused 12-hour blockage. Traffic now flowing but delays expected for 48 hours.",
        category: "LOGISTICS",
        severity: "CRITICAL",
        location: { country: "Egypt", region: "Suez", latitude: 30.45, longitude: 32.35 },
        keywords: ["suez canal", "shipping route", "vessel breakdown", "maritime"]
    },
    {
        title: "Los Angeles Port Reports Record Container Backlog",
        description: "Over 40 container ships anchored outside LA/Long Beach ports. Average wait time exceeds 7 days.",
        category: "LOGISTICS",
        severity: "CRITICAL",
        location: { country: "USA", region: "California", city: "Los Angeles", latitude: 33.74, longitude: -118.27 },
        keywords: ["port congestion", "container backlog", "los angeles", "shipping crisis"]
    },
    {
        title: "Rail Freight Disruption in Northern China",
        description: "Heavy snowfall halts rail freight operations across Heilongjiang province. Recovery expected in 3-4 days.",
        category: "LOGISTICS",
        severity: "MEDIUM",
        location: { country: "China", region: "Heilongjiang", latitude: 45.75, longitude: 126.65 },
        keywords: ["rail disruption", "freight", "china", "weather impact"]
    },
    {
        title: "Panama Canal Implements Water Restrictions",
        description: "Drought conditions force Panama Canal to reduce daily transits by 25%. Shipping companies rerouting vessels.",
        category: "INFRASTRUCTURE",
        severity: "HIGH",
        location: { country: "Panama", region: "Panama Canal", latitude: 9.08, longitude: -79.68 },
        keywords: ["panama canal", "water restrictions", "shipping route", "transit limits"]
    },
    {
        title: "Truck Driver Shortage Worsens in UK",
        description: "Industry reports 15% driver vacancy rate affecting retail supply chains. Delivery delays spreading nationwide.",
        category: "LABOR",
        severity: "MEDIUM",
        location: { country: "United Kingdom", latitude: 51.51, longitude: -0.13 },
        keywords: ["truck driver shortage", "logistics", "uk", "delivery delays"]
    },
    {
        title: "Mumbai Port Operations Suspended Due to Cyclone Warning",
        description: "Jawaharlal Nehru Port suspends operations ahead of approaching cyclone. Container handling halted for 48 hours.",
        category: "NATURAL_DISASTER",
        severity: "HIGH",
        location: { country: "India", region: "Maharashtra", city: "Mumbai", latitude: 18.95, longitude: 72.95 },
        keywords: ["port closure", "cyclone", "mumbai", "jnpt"]
    }
];

class NewsAgent {
    constructor() {
        this.name = 'NEWS_AGENT';
        this.simulationMode = true;
    }

    /**
     * Sense news events - main entry point
     */
    async sense() {
        const reasoning = [];

        reasoning.push(`[${this.name}] 📰 Scanning global news feeds for supply chain disruptions...`);
        await this.delay(300);

        if (this.simulationMode) {
            return this._generateSimulatedEvents(reasoning);
        }

        // Placeholder for live API integration
        reasoning.push(`[${this.name}] ⚠️ Live news fetching not implemented. Using simulation mode.`);
        return { events: [], reasoning };
    }

    /**
     * Generate simulated news events for testing
     */
    async _generateSimulatedEvents(reasoning) {
        const events = [];

        // Randomly select 1-3 events
        const numEvents = Math.floor(Math.random() * 3) + 1;
        const selectedIndices = this._getRandomIndices(SIMULATED_NEWS_EVENTS.length, numEvents);

        reasoning.push(`[${this.name}] Found ${numEvents} potential disruption(s) in news feeds`);
        await this.delay(200);

        for (const idx of selectedIndices) {
            const eventData = SIMULATED_NEWS_EVENTS[idx];
            const confidence = 0.7 + Math.random() * 0.25; // 0.7-0.95

            const event = {
                id: `news-${Date.now()}-${idx}`,
                sourceType: 'NEWS',
                title: eventData.title,
                description: eventData.description,
                category: eventData.category,
                severity: eventData.severity,
                location: eventData.location,
                confidence: parseFloat(confidence.toFixed(2)),
                keywords: eventData.keywords,
                timestamp: new Date().toISOString(),
                source: 'NewsAgent (Simulated)'
            };

            events.push(event);
            reasoning.push(`[${this.name}] 📌 Detected: ${event.title} [${event.severity}]`);
            await this.delay(150);
        }

        reasoning.push(`[${this.name}] ✅ News scan complete. ${events.length} event(s) detected.`);

        return { events, reasoning };
    }

    /**
     * Get random unique indices
     */
    _getRandomIndices(max, count) {
        const indices = [];
        while (indices.length < count && indices.length < max) {
            const idx = Math.floor(Math.random() * max);
            if (!indices.includes(idx)) {
                indices.push(idx);
            }
        }
        return indices;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export default new NewsAgent();
