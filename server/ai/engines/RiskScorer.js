/**
 * Risk Scorer Engine
 * 
 * Calculates composite risk scores for supply chain disruption events
 * based on severity, supplier criticality, financial exposure, and geographic factors.
 */

// Risk level thresholds
const RISK_LEVELS = {
    CRITICAL: { min: 0.8, label: 'CRITICAL' },
    HIGH: { min: 0.6, label: 'HIGH' },
    MEDIUM: { min: 0.4, label: 'MEDIUM' },
    LOW: { min: 0, label: 'LOW' }
};

// Severity value mapping
const SEVERITY_VALUES = {
    CRITICAL: 1.0,
    HIGH: 0.75,
    MEDIUM: 0.5,
    LOW: 0.25
};

// Criticality value mapping
const CRITICALITY_VALUES = {
    CRITICAL: 1.0,
    HIGH: 0.75,
    MEDIUM: 0.5,
    LOW: 0.25
};

class RiskScorer {
    constructor() {
        this.name = 'RISK_SCORER';

        // Weight factors for risk calculation
        this.weights = {
            eventSeverity: 0.30,
            supplierCriticality: 0.30,
            financialExposure: 0.20,
            geographicRisk: 0.20
        };
    }

    /**
     * Calculate comprehensive risk score for an event
     */
    async calculateRiskScore(event, affectedSuppliers = [], geographicRiskFactor = 0.5) {
        const reasoning = [];

        reasoning.push(`[${this.name}] 📊 Calculating risk score for: ${event.title}`);
        await this.delay(200);

        // Calculate component scores
        const severityScore = this._calculateSeverityScore(event);
        const criticalityScore = this._calculateCriticalityScore(affectedSuppliers);
        const financialScore = this._calculateFinancialScore(affectedSuppliers);
        const geoScore = geographicRiskFactor;

        reasoning.push(`[${this.name}] Component Scores:`);
        reasoning.push(`[${this.name}]   - Severity: ${(severityScore * 100).toFixed(0)}%`);
        reasoning.push(`[${this.name}]   - Supplier Criticality: ${(criticalityScore * 100).toFixed(0)}%`);
        reasoning.push(`[${this.name}]   - Financial Exposure: ${(financialScore * 100).toFixed(0)}%`);
        reasoning.push(`[${this.name}]   - Geographic Concentration: ${(geoScore * 100).toFixed(0)}%`);
        await this.delay(150);

        // Calculate weighted composite score
        const compositeScore =
            this.weights.eventSeverity * severityScore +
            this.weights.supplierCriticality * criticalityScore +
            this.weights.financialExposure * financialScore +
            this.weights.geographicRisk * geoScore;

        // Determine risk level
        const riskLevel = this._getRiskLevel(compositeScore);

        // Determine mitigation urgency
        const urgency = this._determineUrgency(compositeScore, criticalityScore);

        // Estimate impacts
        const financialImpact = this._estimateFinancialImpact(affectedSuppliers, compositeScore);
        const delayDays = this._estimateDelayDays(event, compositeScore);

        reasoning.push(`[${this.name}] ━━━━━━━━━━━━━━━━━━━━━━━`);
        reasoning.push(`[${this.name}] 🎯 COMPOSITE SCORE: ${(compositeScore * 100).toFixed(1)}%`);
        reasoning.push(`[${this.name}] ⚠️  RISK LEVEL: ${riskLevel}`);
        reasoning.push(`[${this.name}] ⏱️  URGENCY: ${urgency}`);
        reasoning.push(`[${this.name}] 📉 Est. Delay: ${delayDays} days`);
        reasoning.push(`[${this.name}] 💰 Est. Financial Impact: $${financialImpact.toLocaleString()}`);

        return {
            compositeScore: parseFloat(compositeScore.toFixed(3)),
            riskLevel,
            urgency,
            componentScores: {
                severity: parseFloat(severityScore.toFixed(3)),
                supplierCriticality: parseFloat(criticalityScore.toFixed(3)),
                financialExposure: parseFloat(financialScore.toFixed(3)),
                geographic: parseFloat(geoScore.toFixed(3))
            },
            estimatedFinancialImpact: financialImpact,
            estimatedDelayDays: delayDays,
            reasoning
        };
    }

    _calculateSeverityScore(event) {
        const severity = (event.severity || 'MEDIUM').toUpperCase();
        const confidence = event.confidence || 1.0;
        const impactScore = event.impactScore || 0.5;

        const severityValue = SEVERITY_VALUES[severity] || 0.5;

        // Combine severity with confidence and existing impact score
        return Math.min(1.0, (severityValue * 0.5 + impactScore * 0.5) * confidence);
    }

    _calculateCriticalityScore(suppliers) {
        if (!suppliers || suppliers.length === 0) {
            return 0.3; // Default moderate criticality if no supplier data
        }

        // Use maximum criticality of affected suppliers
        const maxCriticality = Math.max(...suppliers.map(s => {
            const crit = (s.criticality || 'MEDIUM').toUpperCase();
            return CRITICALITY_VALUES[crit] || 0.5;
        }));

        // Add bonus for multiple affected suppliers
        const countBonus = Math.min(0.2, suppliers.length * 0.05);

        return Math.min(1.0, maxCriticality + countBonus);
    }

    _calculateFinancialScore(suppliers) {
        if (!suppliers || suppliers.length === 0) {
            return 0.3; // Default moderate exposure
        }

        const totalSpend = suppliers.reduce((sum, s) => sum + (s.annualSpend || 1000000), 0);

        // Normalize based on typical exposure thresholds
        if (totalSpend >= 10000000) return 1.0;
        if (totalSpend >= 5000000) return 0.7;
        if (totalSpend >= 1000000) return 0.4;
        return 0.2;
    }

    _getRiskLevel(score) {
        if (score >= RISK_LEVELS.CRITICAL.min) return 'CRITICAL';
        if (score >= RISK_LEVELS.HIGH.min) return 'HIGH';
        if (score >= RISK_LEVELS.MEDIUM.min) return 'MEDIUM';
        return 'LOW';
    }

    _determineUrgency(compositeScore, criticalityScore) {
        if (compositeScore >= 0.8 || criticalityScore >= 0.9) return 'IMMEDIATE';
        if (compositeScore >= 0.6) return 'SHORT_TERM';
        if (compositeScore >= 0.4) return 'MEDIUM_TERM';
        return 'LONG_TERM';
    }

    _estimateFinancialImpact(suppliers, riskScore) {
        if (!suppliers || suppliers.length === 0) {
            return Math.round(500000 * riskScore); // Default estimate
        }

        const totalSpend = suppliers.reduce((sum, s) => sum + (s.annualSpend || 1000000), 0);

        // Assume disruption affects 1-4 weeks of annual spend
        const weeksAffected = 1 + (riskScore * 3);
        const weeklySpend = totalSpend / 52;

        return Math.round(weeklySpend * weeksAffected);
    }

    _estimateDelayDays(event, riskScore) {
        const severityDelays = {
            CRITICAL: 14,
            HIGH: 7,
            MEDIUM: 3,
            LOW: 1
        };

        const severity = (event.severity || 'MEDIUM').toUpperCase();
        const baseDelay = severityDelays[severity] || 3;

        return Math.round(baseDelay * (1 + riskScore));
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export default new RiskScorer();
