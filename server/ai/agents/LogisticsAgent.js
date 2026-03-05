/**
 * Logistics/Legal Agent - Contract Generator & Route Optimizer
 * Generates emergency procurement contracts and optimizes shipping routes
 */

class LogisticsAgent {
    constructor() {
        this.name = 'LOGISTICS';
    }

    /**
     * Generate emergency procurement contract and optimize route
     */
    async generateContract(supplier, order, originalSupplier) {
        const reasoning = [];

        reasoning.push(`[${this.name}] 📄 Generating emergency procurement contract...`);
        await this.delay(400);

        const contractId = `EPR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
        reasoning.push(`[${this.name}] Contract ID: ${contractId}`);
        await this.delay(300);

        reasoning.push(`[${this.name}] Supplier: ${supplier.name}`);
        reasoning.push(`[${this.name}] Terms: ${order.quantity.toLocaleString()} units @ $${supplier.cost_per_unit}/unit = $${(order.quantity * supplier.cost_per_unit).toLocaleString()}`);
        await this.delay(300);

        reasoning.push(`[${this.name}] Delivery: ${supplier.lead_time_days} days via air freight`);
        reasoning.push(`[${this.name}] Payment: Net 30 days`);
        await this.delay(300);

        reasoning.push(`[${this.name}]`);
        reasoning.push(`[${this.name}] 🛣️ Optimizing shipping route...`);
        await this.delay(400);

        // Generate route based on supplier location
        const origin = supplier.location.split(',')[0].trim();
        const destination = 'Los Angeles';
        const originalRoute = 'Shanghai → Suez → LA';
        const newRoute = `${origin} → Pacific → ${destination}`;

        reasoning.push(`[${this.name}] Original: ${originalRoute} (BLOCKED)`);
        await this.delay(300);

        reasoning.push(`[${this.name}] Alternative: ${newRoute} (CLEAR)`);
        await this.delay(300);

        // Determine transport mode
        const transportMode = supplier.lead_time_days <= 7 ? 'air' : 'sea + air hybrid';
        reasoning.push(`[${this.name}] Transport Mode: ${transportMode}`);
        await this.delay(300);

        // Calculate ETA
        const etaDate = new Date();
        etaDate.setDate(etaDate.getDate() + supplier.lead_time_days);
        const etaFormatted = etaDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        reasoning.push(`[${this.name}] ETA: ${etaFormatted}`);
        await this.delay(300);

        reasoning.push(`[${this.name}]`);
        reasoning.push(`[${this.name}] ✅ Recovery plan complete. Awaiting buyer approval...`);
        await this.delay(200);

        return {
            contractId,
            route: newRoute,
            transportMode,
            eta: etaDate.toISOString(),
            contract: {
                id: contractId,
                supplier_name: supplier.name,
                supplier_location: supplier.location,
                quantity: order.quantity,
                unit_price: supplier.cost_per_unit,
                total_cost: order.quantity * supplier.cost_per_unit,
                lead_time_days: supplier.lead_time_days,
                payment_terms: 'Net 30',
                transport_mode: transportMode,
            },
            reasoning,
        };
    }

    /**
     * Optimize shipping route between origin and destination
     */
    async optimizeRoute(origin, destination, leadTimeDays) {
        const reasoning = [];

        reasoning.push(`[${this.name}] 🛣️ Optimizing shipping route...`);
        await this.delay(200);

        // Determine route strategy based on lead time
        const transportMode = leadTimeDays <= 7 ? 'air freight' : 'sea + air hybrid';
        const route = `${origin} → Pacific → ${destination}`;

        reasoning.push(`[${this.name}] Route: ${route}`);
        reasoning.push(`[${this.name}] Transport Mode: ${transportMode}`);
        reasoning.push(`[${this.name}] Lead Time: ${leadTimeDays} days`);
        await this.delay(150);

        const etaDate = new Date();
        etaDate.setDate(etaDate.getDate() + leadTimeDays);
        const etaFormatted = etaDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        reasoning.push(`[${this.name}] ETA: ${etaFormatted}`);
        reasoning.push(`[${this.name}] ✅ Route optimized.`);

        return {
            route,
            transportMode,
            eta: etaDate.toISOString(),
            reasoning
        };
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export default new LogisticsAgent();
