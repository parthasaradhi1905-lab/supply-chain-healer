/**
 * Negotiator Agent - Alternative Supplier Finder
 * Searches for alternative suppliers using 100% quantity filter
 */

import Supplier from '../../models/Supplier.js';

class NegotiatorAgent {
    constructor() {
        this.name = 'NEGOTIATOR';
    }

    /**
     * Find alternative suppliers with 100% capacity constraint
     */
    async findAlternatives(quantity, excludeIds = []) {
        const reasoning = [];

        reasoning.push(`[${this.name}] 🤝 Searching alternative suppliers for ${quantity.toLocaleString()} units...`);
        await this.delay(400);

        reasoning.push(`[${this.name}] Applying 100% QUANTITY FILTER: stock_capacity >= ${quantity.toLocaleString()}`);
        await this.delay(300);

        reasoning.push(`[${this.name}] Querying database...`);
        await this.delay(500);

        // Use the tested Phase 1 logic with hard-coded 100% filter
        const suppliers = await Supplier.findAlternatives(quantity, excludeIds, 10);

        reasoning.push(`[${this.name}] ✅ Found ${suppliers.length} qualifying suppliers meeting 100% capacity requirement`);
        await this.delay(400);

        if (excludeIds.length > 0) {
            reasoning.push(`[${this.name}] Excluding suppliers: ${JSON.stringify(excludeIds)}`);
            await this.delay(300);
        }

        reasoning.push(`[${this.name}] Ranking by: Cost (40%), Reliability (30%), Lead Time (30%)`);
        await this.delay(400);

        reasoning.push(`[${this.name}]`);
        await this.delay(100);

        reasoning.push(`[${this.name}] TOP ${Math.min(3, suppliers.length)} CANDIDATES:`);
        await this.delay(300);

        // Display top 3 with detailed info
        const topSuppliers = suppliers.slice(0, 3);
        let idx = 0;
        for (const supplier of topSuppliers) {
            idx++;
            reasoning.push(`[${this.name}]   ${idx}. ${supplier.name} (${supplier.location})`);
            reasoning.push(`[${this.name}]      - Capacity: ${supplier.stock_capacity.toLocaleString()} units ✅`);
            reasoning.push(`[${this.name}]      - Cost: $${supplier.cost_per_unit}/unit`);
            reasoning.push(`[${this.name}]      - Lead Time: ${supplier.lead_time_days} days`);
            reasoning.push(`[${this.name}]      - Reliability: ${supplier.reliability_score}%`);
            await this.delay(200);
        }

        await this.delay(400);

        if (suppliers.length > 0) {
            const topChoice = suppliers[0];
            reasoning.push(`[${this.name}]`);
            reasoning.push(`[${this.name}] ✅ Recommending: ${topChoice.name}`);
            await this.delay(300);
            reasoning.push(`[${this.name}] Passing to LOGISTICS for contract generation...`);
            await this.delay(200);
        } else {
            reasoning.push(`[${this.name}]`);
            reasoning.push(`[${this.name}] ⚠️ No suppliers meet the 100% quantity requirement`);
            reasoning.push(`[${this.name}] Recommendation: Split order across multiple suppliers OR reduce quantity`);
        }

        return { suppliers, reasoning };
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export default new NegotiatorAgent();
