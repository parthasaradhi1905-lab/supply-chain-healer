/**
 * Contract Generator
 * 
 * Generates emergency supplier contracts for recovery plans.
 * Uses templates with optional LLM enhancement for production use.
 */

// Contract types based on urgency
const CONTRACT_TYPES = {
    SPOT_BUY: 'SPOT_BUY',                    // < 7 days recovery
    EXPEDITED_PURCHASE: 'EXPEDITED_PURCHASE', // 7-14 days recovery
    TEMPORARY_AGREEMENT: 'TEMPORARY_AGREEMENT' // > 14 days recovery
};

class ContractGenerator {
    constructor() {
        this.name = 'CONTRACT_GENERATOR';
        this.simulationMode = true;
    }

    /**
     * Generate emergency procurement contract
     */
    async generateContract(supplier, order, recoveryPlan = {}) {
        const reasoning = [];

        reasoning.push(`[${this.name}] 📄 Generating emergency procurement contract...`);
        await this.delay(200);

        // Generate contract ID
        const contractId = `EPR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
        reasoning.push(`[${this.name}] Contract ID: ${contractId}`);
        await this.delay(150);

        // Determine contract type based on urgency
        const contractType = this._determineContractType(recoveryPlan);
        reasoning.push(`[${this.name}] Contract Type: ${contractType}`);

        // Calculate contract value
        const quantity = order.quantity || 10000;
        const unitPrice = supplier.cost_per_unit || 50;
        const totalValue = quantity * unitPrice;

        reasoning.push(`[${this.name}] Terms: ${quantity.toLocaleString()} units @ $${unitPrice}/unit = $${totalValue.toLocaleString()}`);
        await this.delay(150);

        // Generate contract terms
        const terms = this._generateTerms(supplier, order);
        reasoning.push(`[${this.name}] Delivery: ${supplier.lead_time_days || 14} days via ${terms.transportMode}`);
        reasoning.push(`[${this.name}] Payment: ${terms.paymentTerms}`);
        await this.delay(150);

        // Build contract sections
        const contractSections = this._buildContractSections(supplier, order, terms, contractId);

        // Calculate ETA
        const etaDate = new Date();
        etaDate.setDate(etaDate.getDate() + (supplier.lead_time_days || 14));

        reasoning.push(`[${this.name}]`);
        reasoning.push(`[${this.name}] 📋 CONTRACT SECTIONS GENERATED:`);
        Object.keys(contractSections).forEach(section => {
            reasoning.push(`[${this.name}]   ✓ ${section}`);
        });

        reasoning.push(`[${this.name}]`);
        reasoning.push(`[${this.name}] 📅 ETA: ${etaDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`);
        reasoning.push(`[${this.name}] ✅ Contract ready for buyer approval`);

        const contract = {
            id: contractId,
            type: contractType,
            status: 'DRAFT',
            supplier: {
                id: supplier.id,
                name: supplier.name,
                location: supplier.location || supplier.country
            },
            order: {
                id: order.id,
                productName: order.product_name,
                quantity: quantity
            },
            financial: {
                unitPrice,
                totalValue,
                currency: 'USD',
                paymentTerms: terms.paymentTerms
            },
            delivery: {
                leadTimeDays: supplier.lead_time_days || 14,
                transportMode: terms.transportMode,
                shippingTerms: terms.shippingTerms,
                estimatedArrival: etaDate.toISOString()
            },
            legal: {
                durationDays: 90,
                penaltyClause: terms.penaltyClause,
                jurisdiction: terms.jurisdiction
            },
            sections: contractSections,
            createdAt: new Date().toISOString()
        };

        return { contract, reasoning };
    }

    /**
     * Determine contract type based on recovery timeline
     */
    _determineContractType(recoveryPlan) {
        const recoveryDays = recoveryPlan.estimatedRecoveryDays || 14;

        if (recoveryDays <= 7) return CONTRACT_TYPES.SPOT_BUY;
        if (recoveryDays <= 14) return CONTRACT_TYPES.EXPEDITED_PURCHASE;
        return CONTRACT_TYPES.TEMPORARY_AGREEMENT;
    }

    /**
     * Generate contract terms
     */
    _generateTerms(supplier, order) {
        const leadTime = supplier.lead_time_days || 14;

        return {
            paymentTerms: 'Net 30',
            shippingTerms: 'DDP (Delivered Duty Paid)',
            transportMode: leadTime <= 7 ? 'Air Freight' : 'Sea + Air Hybrid',
            qualityStandard: 'ISO 9001',
            penaltyClause: '2% per day for late delivery',
            forceMajeure: 'Standard clause applicable',
            jurisdiction: 'New York, USA'
        };
    }

    /**
     * Build contract sections content
     */
    _buildContractSections(supplier, order, terms, contractId) {
        const effectiveDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        const quantity = order.quantity || 10000;
        const totalValue = quantity * (supplier.cost_per_unit || 50);

        return {
            HEADER: `
EMERGENCY PROCUREMENT CONTRACT
Contract ID: ${contractId}
Effective Date: ${effectiveDate}
Classification: EXPEDITED SUPPLY AGREEMENT
            `.trim(),

            PARTIES: `
BUYER: ACME Corporation
Address: 123 Industrial Way, Chicago, IL 60601

SUPPLIER: ${supplier.name}
Address: ${supplier.location || supplier.country || 'HQ Location'}
            `.trim(),

            SCOPE: `
This agreement covers the emergency procurement of:
- Product: ${order.product_name || 'Industrial Components'}
- Quantity: ${quantity.toLocaleString()} units
- Purpose: Supply chain recovery due to disruption event
            `.trim(),

            PRICING: `
Unit Price: $${supplier.cost_per_unit || 50} USD
Total Contract Value: $${totalValue.toLocaleString()} USD
Payment Terms: ${terms.paymentTerms}
Premium Adjustment: Included for expedited delivery
            `.trim(),

            DELIVERY: `
Lead Time: ${supplier.lead_time_days || 14} calendar days
Transport Mode: ${terms.transportMode}
Shipping Terms: ${terms.shippingTerms}
Delivery Location: Main Distribution Center
            `.trim(),

            QUALITY: `
Quality Standard: ${terms.qualityStandard}
Inspection: Upon receipt, 24-hour acceptance window
Defect Tolerance: 1.0%
Certifications Required: ISO 9001 compliance
            `.trim(),

            TERMINATION: `
Contract Duration: 90 days from effective date
Early Termination: 7 days written notice required
Penalty Clause: ${terms.penaltyClause}
Force Majeure: ${terms.forceMajeure}
            `.trim(),

            SIGNATURE: `
BUYER SIGNATURE: _______________________
Name: Procurement Director
Date: _______________

SUPPLIER SIGNATURE: _______________________
Name: Authorized Representative  
Date: _______________
            `.trim()
        };
    }

    /**
     * Format contract for display
     */
    formatContractSummary(contract) {
        return `
═══════════════════════════════════════════════════════════════════
  CONTRACT: Emergency Supply Agreement - ${contract.supplier.name}
═══════════════════════════════════════════════════════════════════
  ID: ${contract.id}
  Type: ${contract.type}
  Status: ${contract.status}
  
  Supplier: ${contract.supplier.name}
  Value: $${contract.financial.totalValue.toLocaleString()}
  Lead Time: ${contract.delivery.leadTimeDays} days
  
  SECTIONS:
${Object.keys(contract.sections).map(s => `    ✓ ${s}`).join('\n')}
═══════════════════════════════════════════════════════════════════
        `.trim();
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export default new ContractGenerator();
