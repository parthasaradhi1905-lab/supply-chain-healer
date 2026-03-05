/**
 * Impact Analyzer Engine
 * 
 * Analyzes the impact of disruption events on suppliers and orders.
 * Finds affected suppliers by geographic proximity and supply chain dependencies.
 */

class ImpactAnalyzer {
    constructor() {
        this.name = 'IMPACT_ANALYZER';
    }

    /**
     * Find suppliers affected by a disruption event
     */
    async findAffectedSuppliers(event, allSuppliers = []) {
        const reasoning = [];

        reasoning.push(`[${this.name}] 🔍 Analyzing impact of: ${event.title}`);
        await this.delay(200);

        const affectedSuppliers = [];
        const eventLocation = event.location || {};
        const impactRadius = event.impactRadius || 500; // Default 500km radius

        reasoning.push(`[${this.name}] Checking ${allSuppliers.length} suppliers against disruption zone...`);
        await this.delay(150);

        for (const supplier of allSuppliers) {
            const isAffected = this._isSupplierAffected(supplier, eventLocation, impactRadius, event);

            if (isAffected.affected) {
                affectedSuppliers.push({
                    ...supplier,
                    impactReason: isAffected.reason,
                    proximityScore: isAffected.proximityScore
                });
            }
        }

        if (affectedSuppliers.length > 0) {
            reasoning.push(`[${this.name}] ⚠️ Found ${affectedSuppliers.length} affected supplier(s):`);
            for (const supplier of affectedSuppliers.slice(0, 3)) {
                reasoning.push(`[${this.name}]   - ${supplier.name} (${supplier.location || supplier.country})`);
                reasoning.push(`[${this.name}]     Reason: ${supplier.impactReason}`);
            }
        } else {
            reasoning.push(`[${this.name}] ✅ No directly affected suppliers found.`);
        }

        return { affectedSuppliers, reasoning };
    }

    /**
     * Check if a supplier is affected by an event
     */
    _isSupplierAffected(supplier, eventLocation, impactRadius, event) {
        // Check geographic proximity
        if (eventLocation.country && supplier.country) {
            if (supplier.country.toLowerCase() === eventLocation.country.toLowerCase()) {
                return {
                    affected: true,
                    reason: `Located in affected country: ${eventLocation.country}`,
                    proximityScore: 0.9
                };
            }
        }

        // Check if supplier name or location contains event keywords
        const keywords = event.keywords || [];
        const supplierText = `${supplier.name} ${supplier.location || ''} ${supplier.country || ''}`.toLowerCase();

        for (const keyword of keywords) {
            if (supplierText.includes(keyword.toLowerCase())) {
                return {
                    affected: true,
                    reason: `Matches disruption keyword: ${keyword}`,
                    proximityScore: 0.7
                };
            }
        }

        // Check by category match
        if (event.category === 'LOGISTICS' && supplier.type === 'primary') {
            // Primary suppliers are more likely affected by logistics disruptions
            if (Math.random() > 0.7) { // 30% chance of impact for simulation
                return {
                    affected: true,
                    reason: 'Supply chain dependency on affected logistics routes',
                    proximityScore: 0.5
                };
            }
        }

        return { affected: false };
    }

    /**
     * Map disruption events to impacted orders
     */
    async findImpactedOrders(event, affectedSuppliers, allOrders = []) {
        const reasoning = [];

        reasoning.push(`[${this.name}] 📦 Checking orders linked to affected suppliers...`);
        await this.delay(150);

        const affectedSupplierIds = new Set(affectedSuppliers.map(s => s.id));
        const impactedOrders = [];

        for (const order of allOrders) {
            if (affectedSupplierIds.has(order.primary_supplier_id)) {
                impactedOrders.push({
                    ...order,
                    impactReason: `Primary supplier ${order.supplier_name} affected by ${event.title}`
                });
            }
        }

        if (impactedOrders.length > 0) {
            reasoning.push(`[${this.name}] ⚠️ ${impactedOrders.length} order(s) at risk:`);
            for (const order of impactedOrders.slice(0, 3)) {
                reasoning.push(`[${this.name}]   - Order #${order.id}: ${order.product_name}`);
            }
        } else {
            reasoning.push(`[${this.name}] ✅ No orders directly impacted.`);
        }

        return { impactedOrders, reasoning };
    }

    /**
     * Calculate geographic concentration risk
     */
    calculateGeographicConcentration(suppliers) {
        if (!suppliers || suppliers.length === 0) return 0.5;

        // Count suppliers by country
        const countryCount = {};
        for (const supplier of suppliers) {
            const country = supplier.country || 'Unknown';
            countryCount[country] = (countryCount[country] || 0) + 1;
        }

        // Calculate concentration (higher = more risk)
        const totalSuppliers = suppliers.length;
        const uniqueCountries = Object.keys(countryCount).length;

        // If all suppliers in one country = 1.0, if well distributed = lower
        if (uniqueCountries === 1) return 1.0;
        if (uniqueCountries === totalSuppliers) return 0.2;

        return 1 - (uniqueCountries / totalSuppliers);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export default new ImpactAnalyzer();
