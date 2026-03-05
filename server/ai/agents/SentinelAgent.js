/**
 * Sentinel Agent - Disruption Scanner
 * Monitors supply chain disruption feed and detects crisis events
 */

class SentinelAgent {
    constructor() {
        this.name = 'SENTINEL';
    }

    /**
     * Scan for disruptions and generate realistic reasoning
     */
    async scanForDisruptions(disruptionType, orderId) {
        const reasoning = [];

        reasoning.push(`[${this.name}] 🔍 Scanning global supply chain disruption feed...`);
        await this.delay(500);

        // Define disruption scenarios
        const scenarios = {
            suez_blockage: {
                title: 'Suez Canal Blockage - Critical Delay',
                type: 'suez_blockage',
                severity: 'critical',
                affected_routes: ['Suez Canal', 'Red Sea', 'Mediterranean'],
                affected_transport_modes: ['sea'],
                impact_description: 'Major container ship blocking Suez Canal. Estimated 48-72 hour delay for all sea freight through the region.',
            },
            hurricane: {
                title: 'Hurricane Warning - Pacific Northwest',
                type: 'hurricane',
                severity: 'high',
                affected_routes: ['Pacific Northwest', 'Seattle Port', 'Vancouver Port'],
                affected_transport_modes: ['sea', 'air'],
                impact_description: 'Category 3 hurricane approaching Pacific Northwest. Port closures expected for 36-48 hours.',
            },
            labor_strike: {
                title: 'Port Workers Strike - Los Angeles',
                type: 'labor_strike',
                severity: 'high',
                affected_routes: ['Los Angeles Port', 'Long Beach Port'],
                affected_transport_modes: ['sea'],
                impact_description: 'Port workers initiating strike action. All loading/unloading operations suspended indefinitely.',
            },
        };

        const disruption = scenarios[disruptionType] || scenarios.suez_blockage;

        reasoning.push(`[${this.name}] ⚠️ ALERT DETECTED: ${disruption.title}`);
        await this.delay(300);

        reasoning.push(`[${this.name}] Severity: ${disruption.severity.toUpperCase()} | Affected Routes: ${JSON.stringify(disruption.affected_routes)}`);
        await this.delay(300);

        reasoning.push(`[${this.name}] Transport Modes Affected: ${JSON.stringify(disruption.affected_transport_modes)}`);
        await this.delay(300);

        reasoning.push(`[${this.name}] Matching active shipments against disruption criteria...`);
        await this.delay(400);

        reasoning.push(`[${this.name}] ✅ Found 2 shipments at risk for Order #${orderId}`);
        await this.delay(300);

        reasoning.push(`[${this.name}] Escalating to ANALYST for impact assessment...`);
        await this.delay(200);

        return { disruption, reasoning };
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export default new SentinelAgent();
