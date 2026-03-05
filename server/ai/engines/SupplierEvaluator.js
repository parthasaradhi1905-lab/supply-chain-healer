/**
 * Supplier Evaluator Engine
 * 
 * Evaluates and ranks alternative suppliers based on multiple criteria:
 * cost, reliability, lead time, capacity, and geographic diversification.
 */

class SupplierEvaluator {
    constructor() {
        this.name = 'SUPPLIER_EVALUATOR';

        // Weights for multi-criteria ranking
        this.weights = {
            cost: 0.30,
            reliability: 0.25,
            leadTime: 0.20,
            capacity: 0.15,
            geographic: 0.10
        };
    }

    /**
     * Evaluate and rank suppliers for a specific order
     */
    async evaluateSuppliers(suppliers, requiredQuantity, excludeIds = [], riskContext = null) {
        const reasoning = [];

        reasoning.push(`[${this.name}] 📋 Evaluating ${suppliers.length} potential suppliers...`);
        reasoning.push(`[${this.name}] Required quantity: ${requiredQuantity.toLocaleString()} units`);
        await this.delay(200);

        // Filter suppliers that meet 100% capacity requirement
        const qualifiedSuppliers = suppliers.filter(s => {
            if (excludeIds.includes(s.id)) return false;
            return s.stock_capacity >= requiredQuantity;
        });

        reasoning.push(`[${this.name}] ✅ ${qualifiedSuppliers.length} supplier(s) meet 100% capacity requirement`);

        if (qualifiedSuppliers.length === 0) {
            reasoning.push(`[${this.name}] ⚠️ No suppliers can fulfill entire order quantity`);
            return { rankedSuppliers: [], reasoning };
        }

        await this.delay(150);

        // Score each supplier
        const scoredSuppliers = qualifiedSuppliers.map(supplier => {
            const scores = this._calculateScores(supplier, requiredQuantity, riskContext);
            const totalScore = this._calculateWeightedScore(scores);

            return {
                ...supplier,
                evaluationScores: scores,
                totalScore,
                recommendation: this._getRecommendation(totalScore)
            };
        });

        // Sort by total score (higher is better)
        scoredSuppliers.sort((a, b) => b.totalScore - a.totalScore);

        reasoning.push(`[${this.name}] 📊 Evaluation Criteria: Cost(30%), Reliability(25%), Lead Time(20%), Capacity(15%), Geographic(10%)`);
        reasoning.push(`[${this.name}]`);
        reasoning.push(`[${this.name}] 🏆 TOP RECOMMENDATIONS:`);

        scoredSuppliers.slice(0, 3).forEach((supplier, idx) => {
            reasoning.push(`[${this.name}]   ${idx + 1}. ${supplier.name}`);
            reasoning.push(`[${this.name}]      Score: ${(supplier.totalScore * 100).toFixed(1)}% | ${supplier.recommendation}`);
            reasoning.push(`[${this.name}]      Cost: $${supplier.cost_per_unit}/unit | Lead: ${supplier.lead_time_days} days | Reliability: ${supplier.reliability_score}%`);
        });

        return { rankedSuppliers: scoredSuppliers, reasoning };
    }

    /**
     * Calculate individual scores for a supplier
     */
    _calculateScores(supplier, requiredQuantity, riskContext) {
        return {
            cost: this._scoreCost(supplier.cost_per_unit),
            reliability: this._scoreReliability(supplier.reliability_score),
            leadTime: this._scoreLeadTime(supplier.lead_time_days),
            capacity: this._scoreCapacity(supplier.stock_capacity, requiredQuantity),
            geographic: this._scoreGeographic(supplier, riskContext)
        };
    }

    /**
     * Lower cost = higher score
     */
    _scoreCost(costPerUnit) {
        // Assuming typical range is $10-$150 per unit
        if (costPerUnit <= 20) return 1.0;
        if (costPerUnit <= 50) return 0.8;
        if (costPerUnit <= 80) return 0.6;
        if (costPerUnit <= 120) return 0.4;
        return 0.2;
    }

    /**
     * Higher reliability = higher score
     */
    _scoreReliability(reliabilityScore) {
        return (reliabilityScore || 80) / 100;
    }

    /**
     * Shorter lead time = higher score
     */
    _scoreLeadTime(leadTimeDays) {
        if (leadTimeDays <= 7) return 1.0;
        if (leadTimeDays <= 14) return 0.8;
        if (leadTimeDays <= 21) return 0.6;
        if (leadTimeDays <= 30) return 0.4;
        return 0.2;
    }

    /**
     * More excess capacity = higher score
     */
    _scoreCapacity(stockCapacity, requiredQuantity) {
        const excessRatio = stockCapacity / requiredQuantity;
        if (excessRatio >= 2.0) return 1.0;
        if (excessRatio >= 1.5) return 0.8;
        if (excessRatio >= 1.2) return 0.6;
        return 0.4; // Just meets requirement
    }

    /**
     * Geographic diversification score
     */
    _scoreGeographic(supplier, riskContext) {
        // If risk context shows geographic concentration, prefer different regions
        if (!riskContext) return 0.5;

        const affectedCountry = riskContext.location?.country;
        const supplierCountry = supplier.country || supplier.location;

        if (affectedCountry && supplierCountry) {
            // Different country = better diversification
            if (!supplierCountry.toLowerCase().includes(affectedCountry.toLowerCase())) {
                return 0.9;
            }
        }

        return 0.4; // Same region = lower score
    }

    /**
     * Calculate weighted total score
     */
    _calculateWeightedScore(scores) {
        return (
            this.weights.cost * scores.cost +
            this.weights.reliability * scores.reliability +
            this.weights.leadTime * scores.leadTime +
            this.weights.capacity * scores.capacity +
            this.weights.geographic * scores.geographic
        );
    }

    /**
     * Get recommendation label based on score
     */
    _getRecommendation(score) {
        if (score >= 0.8) return '⭐ HIGHLY RECOMMENDED';
        if (score >= 0.6) return '✅ RECOMMENDED';
        if (score >= 0.4) return '⚡ ACCEPTABLE';
        return '⚠️ USE WITH CAUTION';
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export default new SupplierEvaluator();
