/**
 * Weather Agent - Natural Disaster Monitor
 * 
 * Monitors weather events that can affect supply chains.
 * Tracks hurricanes, floods, cyclones, and extreme weather.
 */

// Simulated weather events for testing
const SIMULATED_WEATHER_EVENTS = [
    {
        title: "Typhoon Koinu Approaches Taiwan",
        description: "Category 4 typhoon expected to make landfall within 48 hours. Major disruptions to shipping and manufacturing expected.",
        category: "NATURAL_DISASTER",
        severity: "CRITICAL",
        location: { country: "Taiwan", city: "Kaohsiung", latitude: 22.62, longitude: 120.31 },
        impactRadius: 500, // km
        keywords: ["typhoon", "taiwan", "manufacturing", "port closure"]
    },
    {
        title: "Severe Flooding in Bangkok Region",
        description: "Monsoon rains cause widespread flooding across Bangkok industrial zones. Multiple factories report production halts.",
        category: "NATURAL_DISASTER",
        severity: "HIGH",
        location: { country: "Thailand", city: "Bangkok", latitude: 13.75, longitude: 100.50 },
        impactRadius: 100,
        keywords: ["flooding", "thailand", "manufacturing", "monsoon"]
    },
    {
        title: "Winter Storm Disrupts European Logistics",
        description: "Heavy snowfall and freezing temperatures affecting Germany and Poland. Highway closures impacting ground freight.",
        category: "NATURAL_DISASTER",
        severity: "MEDIUM",
        location: { country: "Germany", city: "Berlin", latitude: 52.52, longitude: 13.40 },
        impactRadius: 300,
        keywords: ["winter storm", "europe", "highway closure", "freight delay"]
    },
    {
        title: "Cyclone Warning for Bay of Bengal",
        description: "IMD issues red alert for cyclonic storm. Ports in Chennai and Visakhapatnam preparing for closures.",
        category: "NATURAL_DISASTER",
        severity: "HIGH",
        location: { country: "India", region: "Bay of Bengal", latitude: 13.08, longitude: 80.27 },
        impactRadius: 400,
        keywords: ["cyclone", "india", "port closure", "shipping delay"]
    },
    {
        title: "Drought Conditions Impact Mexican Agriculture",
        description: "Severe drought in northern Mexico affecting raw material supply. Water rationing impacting manufacturing operations.",
        category: "NATURAL_DISASTER",
        severity: "MEDIUM",
        location: { country: "Mexico", region: "Nuevo León", city: "Monterrey", latitude: 25.67, longitude: -100.31 },
        impactRadius: 200,
        keywords: ["drought", "mexico", "manufacturing", "water shortage"]
    },
    {
        title: "Earthquake Damages Japanese Supply Lines",
        description: "6.2 magnitude earthquake in central Japan. Rail networks temporarily suspended, semiconductor plants conducting inspections.",
        category: "NATURAL_DISASTER",
        severity: "HIGH",
        location: { country: "Japan", region: "Honshu", latitude: 35.68, longitude: 139.65 },
        impactRadius: 150,
        keywords: ["earthquake", "japan", "semiconductor", "rail disruption"]
    },
    {
        title: "Wildfire Smoke Grounds Flights in Western US",
        description: "Air quality concerns leading to flight cancellations across Pacific Northwest. Air freight delays expected for 3-5 days.",
        category: "NATURAL_DISASTER",
        severity: "MEDIUM",
        location: { country: "USA", region: "Oregon", city: "Portland", latitude: 45.52, longitude: -122.68 },
        impactRadius: 250,
        keywords: ["wildfire", "air freight", "usa", "flight cancellation"]
    }
];

class WeatherAgent {
    constructor() {
        this.name = 'WEATHER_AGENT';
        this.simulationMode = true;
    }

    /**
     * Sense weather events - main entry point
     */
    async sense() {
        const reasoning = [];

        reasoning.push(`[${this.name}] 🌪️ Monitoring global weather systems for potential disruptions...`);
        await this.delay(300);

        if (this.simulationMode) {
            return this._generateSimulatedEvents(reasoning);
        }

        // Placeholder for live API integration (OpenWeatherMap, etc.)
        reasoning.push(`[${this.name}] ⚠️ Live weather fetching not implemented. Using simulation mode.`);
        return { events: [], reasoning };
    }

    /**
     * Generate simulated weather events for testing
     */
    async _generateSimulatedEvents(reasoning) {
        const events = [];

        // Randomly select 0-2 weather events
        const numEvents = Math.floor(Math.random() * 3);

        if (numEvents === 0) {
            reasoning.push(`[${this.name}] ✅ No significant weather threats detected.`);
            return { events, reasoning };
        }

        const selectedIndices = this._getRandomIndices(SIMULATED_WEATHER_EVENTS.length, numEvents);

        reasoning.push(`[${this.name}] ⚠️ Detected ${numEvents} weather event(s) affecting supply chains`);
        await this.delay(200);

        for (const idx of selectedIndices) {
            const eventData = SIMULATED_WEATHER_EVENTS[idx];
            const confidence = 0.75 + Math.random() * 0.2; // 0.75-0.95 (weather is more predictable)

            const event = {
                id: `weather-${Date.now()}-${idx}`,
                sourceType: 'WEATHER',
                title: eventData.title,
                description: eventData.description,
                category: eventData.category,
                severity: eventData.severity,
                location: eventData.location,
                impactRadius: eventData.impactRadius,
                confidence: parseFloat(confidence.toFixed(2)),
                keywords: eventData.keywords,
                timestamp: new Date().toISOString(),
                source: 'WeatherAgent (Simulated)'
            };

            events.push(event);
            reasoning.push(`[${this.name}] 🌊 Alert: ${event.title} [${event.severity}]`);
            reasoning.push(`[${this.name}]    Impact radius: ${event.impactRadius}km around ${event.location.city || event.location.region}`);
            await this.delay(150);
        }

        reasoning.push(`[${this.name}] ✅ Weather scan complete. ${events.length} threat(s) identified.`);

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

export default new WeatherAgent();
