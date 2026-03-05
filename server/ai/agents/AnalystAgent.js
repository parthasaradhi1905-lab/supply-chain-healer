/**
 * Analyst Agent - Impact Calculator
 * Analyzes disruption impact on orders and calculates risk levels
 */

class AnalystAgent {
    constructor() {
        this.name = 'ANALYST';
    }

    /**
     * Analyze impact of disruption on specific order
     */
    async analyzeImpact(disruption, order) {
        const reasoning = [];

        reasoning.push(`[${this.name}] 📊 Analyzing disruption impact on Order #${order.id}...`);
        await this.delay(400);

        reasoning.push(`[${this.name}] Product: ${order.product_name} | Quantity: ${order.quantity.toLocaleString()} units`);
        await this.delay(300);

        reasoning.push(`[${this.name}] Current shipment location: Suez Canal (65% complete)`);
        await this.delay(300);

        // Calculate estimated delay based on severity
        const delayHours = disruption.severity === 'critical' ? '48-72' : '24-48';
        reasoning.push(`[${this.name}] Expected delay: ${delayHours} hours minimum`);
        await this.delay(300);

        // Calculate inventory buffer
        const inventoryDays = 36;
        reasoning.push(`[${this.name}] Current inventory buffer: ${inventoryDays} days`);
        await this.delay(300);

        const daysToStall = inventoryDays - 2; // Buffer for delays
        reasoning.push(`[${this.name}] Time to factory stall: ~${daysToStall} days remaining`);
        await this.delay(400);

        // Calculate risk level
        const riskLevel = disruption.severity === 'critical' ? 82 : 65;
        const riskEmoji = riskLevel >= 75 ? '🔴' : riskLevel >= 50 ? '🟡' : '🟢';

        reasoning.push(`[${this.name}] ${riskEmoji} RISK LEVEL: ${riskLevel >= 75 ? 'HIGH' : 'MEDIUM'} (${riskLevel}%)`);
        await this.delay(400);

        reasoning.push(`[${this.name}] Recommendation: Activate alternative sourcing immediately`);
        await this.delay(300);

        reasoning.push(`[${this.name}] Handing off to NEGOTIATOR for supplier search...`);
        await this.delay(200);

        return {
            riskLevel,
            delayHours,
            inventoryDays,
            daysToStall,
            recommendation: 'activate_alternative_sourcing',
            reasoning,
        };
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export default new AnalystAgent();
