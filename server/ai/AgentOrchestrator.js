/**
 * Agent Orchestrator - Master Controller for AI Workflow
 * 
 * Implements 4-stage self-healing pipeline:
 * Stage 1: Event Sensing (NewsAgent + WeatherAgent)
 * Stage 2: Risk Analysis (RiskScorer + ImpactAnalyzer)
 * Stage 3: Recovery Planning (SupplierEvaluator + NegotiatorAgent)
 * Stage 4: Contract Drafting (ContractGenerator + LogisticsAgent)
 */

// Import original agents
import SentinelAgent from './agents/SentinelAgent.js';
import AnalystAgent from './agents/AnalystAgent.js';
import NegotiatorAgent from './agents/NegotiatorAgent.js';
import LogisticsAgent from './agents/LogisticsAgent.js';

// Import new agents
import NewsAgent from './agents/NewsAgent.js';
import WeatherAgent from './agents/WeatherAgent.js';

// Import engines
import RiskScorer from './engines/RiskScorer.js';
import ImpactAnalyzer from './engines/ImpactAnalyzer.js';
import SupplierEvaluator from './engines/SupplierEvaluator.js';

// Import generators
import ContractGenerator from './generators/ContractGenerator.js';

// Import models
import Disruption from '../models/Disruption.js';
import Order from '../models/Order.js';
import RecoveryPlan from '../models/RecoveryPlan.js';
import Supplier from '../models/Supplier.js';

// Pipeline stages
const PIPELINE_STAGES = {
    EVENT_SENSING: 'EVENT_SENSING',
    RISK_ANALYSIS: 'RISK_ANALYSIS',
    RECOVERY_PLANNING: 'RECOVERY_PLANNING',
    CONTRACT_DRAFTING: 'CONTRACT_DRAFTING'
};

class AgentOrchestrator {
    constructor() {
        this.activeSessions = new Map();
    }

    /**
     * Run the complete 4-stage self-healing pipeline
     */
    async runFullPipeline(orderId = null) {
        const sessionId = `pipeline-${Date.now()}`;
        const allReasoning = [];
        const stageResults = {};
        const startTime = Date.now();

        this._printHeader(allReasoning);

        try {
            // Stage 1: Event Sensing
            const eventResult = await this._executeEventSensing(allReasoning);
            stageResults[PIPELINE_STAGES.EVENT_SENSING] = eventResult;

            if (eventResult.events.length === 0) {
                allReasoning.push('[ORCHESTRATOR] ✅ No significant events detected. System healthy.');
                return this._buildResult(sessionId, true, stageResults, allReasoning, startTime);
            }

            // Get order context
            let order = null;
            if (orderId) {
                order = await Order.findById(orderId);
            } else {
                // Get first pending order for demo
                const orders = await Order.getAll();
                order = orders.find(o => o.status === 'pending') || orders[0];
            }

            if (!order) {
                allReasoning.push('[ORCHESTRATOR] ⚠️ No orders found in system.');
                return this._buildResult(sessionId, false, stageResults, allReasoning, startTime);
            }

            // Get all suppliers for analysis
            const allSuppliers = await Supplier.getAll();

            // Stage 2: Risk Analysis
            const primaryEvent = eventResult.events[0];
            const riskResult = await this._executeRiskAnalysis(primaryEvent, allSuppliers, [order], allReasoning);
            stageResults[PIPELINE_STAGES.RISK_ANALYSIS] = riskResult;

            // Create disruption record
            const disruptionId = await Disruption.create({
                type: primaryEvent.category,
                title: primaryEvent.title,
                severity: primaryEvent.severity,
                affected_routes: JSON.stringify([primaryEvent.location?.country || 'Global']),
                affected_transport_modes: JSON.stringify(['sea', 'air']),
                impact_description: primaryEvent.description
            });

            // Stage 3: Recovery Planning
            const recoveryResult = await this._executeRecoveryPlanning(
                order,
                riskResult.affectedSuppliers,
                primaryEvent,
                allReasoning
            );
            stageResults[PIPELINE_STAGES.RECOVERY_PLANNING] = recoveryResult;

            if (recoveryResult.rankedSuppliers.length === 0) {
                allReasoning.push('[ORCHESTRATOR] ⚠️ No qualified alternative suppliers found.');
                return this._buildResult(sessionId, false, stageResults, allReasoning, startTime);
            }

            // Stage 4: Contract Drafting
            const contractResult = await this._executeContractDrafting(
                recoveryResult.rankedSuppliers[0],
                order,
                riskResult,
                allReasoning
            );
            stageResults[PIPELINE_STAGES.CONTRACT_DRAFTING] = contractResult;

            // Create recovery plans
            const plans = await this._createRecoveryPlans(order, disruptionId, recoveryResult, contractResult, allReasoning);

            // Update order status
            await Order.updateStatus(order.id, 'at_risk');

            this._printSummary(stageResults, allReasoning, startTime);

            return {
                sessionId,
                success: true,
                stageResults,
                disruptionId,
                plans,
                reasoning: allReasoning
            };

        } catch (error) {
            allReasoning.push(`[ORCHESTRATOR] ❌ PIPELINE ERROR: ${error.message}`);
            return this._buildResult(sessionId, false, stageResults, allReasoning, startTime, error.message);
        }
    }

    /**
     * Stage 1: Event Sensing
     */
    async _executeEventSensing(reasoning) {
        reasoning.push('');
        reasoning.push('╔═══════════════════════════════════════════════════════════════════╗');
        reasoning.push('║  📡 STAGE 1: EVENT SENSING                                        ║');
        reasoning.push('╚═══════════════════════════════════════════════════════════════════╝');
        reasoning.push('');

        const startTime = Date.now();

        // Collect events from both agents
        const newsResult = await NewsAgent.sense();
        reasoning.push(...newsResult.reasoning);

        const weatherResult = await WeatherAgent.sense();
        reasoning.push(...weatherResult.reasoning);

        // Combine and prioritize events by severity
        const allEvents = [...newsResult.events, ...weatherResult.events];
        allEvents.sort((a, b) => {
            const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
            return severityOrder[a.severity] - severityOrder[b.severity];
        });

        reasoning.push('');
        reasoning.push(`[EVENT_SENSING] ⏱️ Stage completed in ${Date.now() - startTime}ms`);
        reasoning.push(`[EVENT_SENSING] 📊 Total events detected: ${allEvents.length}`);

        return { events: allEvents, durationMs: Date.now() - startTime };
    }

    /**
     * Stage 2: Risk Analysis
     */
    async _executeRiskAnalysis(event, allSuppliers, orders, reasoning) {
        reasoning.push('');
        reasoning.push('╔═══════════════════════════════════════════════════════════════════╗');
        reasoning.push('║  🔍 STAGE 2: RISK ANALYSIS                                        ║');
        reasoning.push('╚═══════════════════════════════════════════════════════════════════╝');
        reasoning.push('');

        const startTime = Date.now();

        // Find affected suppliers
        const impactResult = await ImpactAnalyzer.findAffectedSuppliers(event, allSuppliers);
        reasoning.push(...impactResult.reasoning);

        // Calculate geographic concentration
        const geoRisk = ImpactAnalyzer.calculateGeographicConcentration(allSuppliers);

        // Calculate risk score
        const riskResult = await RiskScorer.calculateRiskScore(
            event,
            impactResult.affectedSuppliers,
            geoRisk
        );
        reasoning.push(...riskResult.reasoning);

        // Find impacted orders
        const orderResult = await ImpactAnalyzer.findImpactedOrders(event, impactResult.affectedSuppliers, orders);
        reasoning.push(...orderResult.reasoning);

        reasoning.push('');
        reasoning.push(`[RISK_ANALYSIS] ⏱️ Stage completed in ${Date.now() - startTime}ms`);

        return {
            riskScore: riskResult,
            affectedSuppliers: impactResult.affectedSuppliers,
            impactedOrders: orderResult.impactedOrders,
            durationMs: Date.now() - startTime
        };
    }

    /**
     * Stage 3: Recovery Planning
     */
    async _executeRecoveryPlanning(order, affectedSuppliers, event, reasoning) {
        reasoning.push('');
        reasoning.push('╔═══════════════════════════════════════════════════════════════════╗');
        reasoning.push('║  📋 STAGE 3: RECOVERY PLANNING                                    ║');
        reasoning.push('╚═══════════════════════════════════════════════════════════════════╝');
        reasoning.push('');

        const startTime = Date.now();

        // Get all suppliers
        const allSuppliers = await Supplier.getAll();

        // Exclude affected supplier IDs
        const excludedIds = [order.primary_supplier_id, ...affectedSuppliers.map(s => s.id)];

        // Evaluate available suppliers
        const evalResult = await SupplierEvaluator.evaluateSuppliers(
            allSuppliers,
            order.quantity,
            excludedIds,
            event
        );
        reasoning.push(...evalResult.reasoning);

        reasoning.push('');
        reasoning.push(`[RECOVERY_PLANNING] ⏱️ Stage completed in ${Date.now() - startTime}ms`);

        return {
            rankedSuppliers: evalResult.rankedSuppliers,
            durationMs: Date.now() - startTime
        };
    }

    /**
     * Stage 4: Contract Drafting
     */
    async _executeContractDrafting(supplier, order, riskResult, reasoning) {
        reasoning.push('');
        reasoning.push('╔═══════════════════════════════════════════════════════════════════╗');
        reasoning.push('║  📝 STAGE 4: CONTRACT DRAFTING                                    ║');
        reasoning.push('╚═══════════════════════════════════════════════════════════════════╝');
        reasoning.push('');

        const startTime = Date.now();

        // Generate contract
        const contractResult = await ContractGenerator.generateContract(
            supplier,
            order,
            { estimatedRecoveryDays: riskResult.riskScore?.estimatedDelayDays || 14 }
        );
        reasoning.push(...contractResult.reasoning);

        // Also use logistics agent for route optimization
        const { reasoning: logisticsReasoning } = await LogisticsAgent.optimizeRoute(
            supplier.location || supplier.country,
            'Chicago Distribution Center',
            supplier.lead_time_days
        );
        reasoning.push(...logisticsReasoning);

        reasoning.push('');
        reasoning.push(`[CONTRACT_DRAFTING] ⏱️ Stage completed in ${Date.now() - startTime}ms`);

        return {
            contract: contractResult.contract,
            durationMs: Date.now() - startTime
        };
    }

    /**
     * Create recovery plans in database
     */
    async _createRecoveryPlans(order, disruptionId, recoveryResult, contractResult, reasoning) {
        const topSupplier = recoveryResult.rankedSuppliers[0];
        const newCost = order.quantity * topSupplier.cost_per_unit;
        const costIncrease = ((newCost - order.total_cost) / order.total_cost) * 100;

        // Plan A (original - failed)
        const planAId = await RecoveryPlan.create({
            order_id: order.id,
            disruption_id: disruptionId,
            alternative_supplier_id: order.primary_supplier_id,
            plan_label: 'Plan A',
            quantity: order.quantity,
            unit_price: order.unit_price,
            total_cost: order.total_cost,
            new_lead_time_days: 18,
            cost_increase_percent: 0,
            time_increase_percent: 0,
            status: 'rejected',
            ai_reasoning: 'Original supplier affected by supply chain disruption'
        });

        // Plan B (recommended)
        const planBId = await RecoveryPlan.create({
            order_id: order.id,
            disruption_id: disruptionId,
            alternative_supplier_id: topSupplier.id,
            plan_label: 'Plan B',
            quantity: order.quantity,
            unit_price: topSupplier.cost_per_unit,
            total_cost: newCost,
            new_lead_time_days: topSupplier.lead_time_days,
            cost_increase_percent: costIncrease,
            time_increase_percent: 0,
            status: 'proposed',
            ai_reasoning: `Recommended by AI: ${topSupplier.recommendation || 'Top ranked supplier'}`
        });

        reasoning.push('[ORCHESTRATOR] 📄 Recovery plans created in database');

        return {
            planA: await RecoveryPlan.findById(planAId),
            planB: await RecoveryPlan.findById(planBId)
        };
    }

    /**
     * Execute complete AI workflow for crisis response (legacy method)
     */
    async executeCrisisResponse(disruptionType, orderId, excludedSuppliers = []) {
        const sessionId = `session-${Date.now()}`;
        const allReasoning = [];

        try {
            // Step 1: Sentinel - Detect disruption
            const { disruption, reasoning: sentinelReasoning } = await SentinelAgent.scanForDisruptions(disruptionType, orderId);
            allReasoning.push(...sentinelReasoning);

            // Create disruption in database
            const disruptionId = await Disruption.create(disruption);
            const disruptionData = await Disruption.findById(disruptionId);

            // Get order details
            const order = await Order.findById(orderId);
            if (!order) {
                throw new Error(`Order ${orderId} not found`);
            }

            // Step 2: Analyst - Analyze impact
            const { riskLevel, reasoning: analystReasoning } = await AnalystAgent.analyzeImpact(disruptionData, order);
            allReasoning.push(...analystReasoning);

            // Step 3: Negotiator - Find alternatives
            const { suppliers, reasoning: negotiatorReasoning } = await NegotiatorAgent.findAlternatives(
                order.quantity,
                [order.primary_supplier_id, ...excludedSuppliers]
            );
            allReasoning.push(...negotiatorReasoning);

            if (suppliers.length === 0) {
                allReasoning.push('[ORCHESTRATOR] ⚠️ No alternative suppliers available. Crisis cannot be auto-resolved.');
                return {
                    sessionId,
                    success: false,
                    message: 'No suppliers meet 100% quantity requirement',
                    reasoning: allReasoning,
                };
            }

            // Step 4: Logistics - Generate contract for top supplier
            const topSupplier = suppliers[0];
            const { contractId, contract, reasoning: logisticsReasoning } = await LogisticsAgent.generateContract(
                topSupplier,
                order,
                order.primary_supplier_id
            );
            allReasoning.push(...logisticsReasoning);

            // Calculate cost/time changes
            const originalCost = order.total_cost;
            const newCost = contract.total_cost;
            const costIncrease = ((newCost - originalCost) / originalCost) * 100;

            // Create recovery plans
            const planAId = await RecoveryPlan.create({
                order_id: orderId,
                disruption_id: disruptionId,
                alternative_supplier_id: order.primary_supplier_id,
                plan_label: 'Plan A',
                quantity: order.quantity,
                unit_price: order.unit_price,
                total_cost: originalCost,
                new_lead_time_days: 18,
                cost_increase_percent: 0,
                time_increase_percent: 0,
                status: 'rejected',
                ai_reasoning: 'Original supplier blocked by disruption',
            });

            const planBId = await RecoveryPlan.create({
                order_id: orderId,
                disruption_id: disruptionId,
                alternative_supplier_id: topSupplier.id,
                plan_label: 'Plan B',
                quantity: order.quantity,
                unit_price: topSupplier.cost_per_unit,
                total_cost: newCost,
                new_lead_time_days: topSupplier.lead_time_days,
                cost_increase_percent: costIncrease,
                time_increase_percent: 0,
                status: 'proposed',
                ai_reasoning: allReasoning.join('\n'),
            });

            await Order.updateStatus(orderId, 'at_risk');

            allReasoning.push('');
            allReasoning.push('[ORCHESTRATOR] ✅ Crisis response complete. Plans generated and awaiting buyer decision.');

            return {
                sessionId,
                success: true,
                disruptionId,
                planA: await RecoveryPlan.findById(planAId),
                planB: await RecoveryPlan.findById(planBId),
                allSuppliers: suppliers,
                reasoning: allReasoning,
                contractId,
            };
        } catch (error) {
            allReasoning.push(`[ORCHESTRATOR] ❌ ERROR: ${error.message}`);
            return {
                sessionId,
                success: false,
                error: error.message,
                reasoning: allReasoning,
            };
        }
    }

    /**
     * Handle plan rejection and generate next alternative
     */
    async handlePlanRejection(planId, reason, orderId) {
        const allReasoning = [];

        const rejectedPlan = await RecoveryPlan.findById(planId);
        if (!rejectedPlan) {
            throw new Error('Plan not found');
        }

        const previousPlans = await RecoveryPlan.findByOrder(orderId);
        const excludedSupplierIds = previousPlans
            .filter(p => p.status === 'rejected')
            .map(p => p.alternative_supplier_id);

        allReasoning.push('[NEGOTIATOR] 🔄 Plan rejected. Searching for next best alternative...');
        allReasoning.push(`[NEGOTIATOR] Reason: ${reason}`);

        const order = await Order.findById(orderId);
        const { suppliers, reasoning: negotiatorReasoning } = await NegotiatorAgent.findAlternatives(
            order.quantity,
            excludedSupplierIds
        );

        allReasoning.push(...negotiatorReasoning);

        if (suppliers.length === 0) {
            allReasoning.push('[NEGOTIATOR] ⚠️ No more alternatives available.');
            return { success: false, message: 'No more suppliers available', reasoning: allReasoning };
        }

        const nextSupplier = suppliers[0];
        const { contract, reasoning: logisticsReasoning } = await LogisticsAgent.generateContract(nextSupplier, order);
        allReasoning.push(...logisticsReasoning);

        const costIncrease = ((contract.total_cost - order.total_cost) / order.total_cost) * 100;
        const planLabel = `Plan ${String.fromCharCode(66 + previousPlans.filter(p => p.status !== 'rejected').length)}`;

        const newPlanId = await RecoveryPlan.create({
            order_id: orderId,
            disruption_id: rejectedPlan.disruption_id,
            alternative_supplier_id: nextSupplier.id,
            plan_label: planLabel,
            quantity: order.quantity,
            unit_price: nextSupplier.cost_per_unit,
            total_cost: contract.total_cost,
            new_lead_time_days: nextSupplier.lead_time_days,
            cost_increase_percent: costIncrease,
            time_increase_percent: 0,
            status: 'proposed',
            ai_reasoning: allReasoning.join('\n'),
        });

        return { success: true, newPlan: await RecoveryPlan.findById(newPlanId), reasoning: allReasoning };
    }

    // Helper methods
    _printHeader(reasoning) {
        reasoning.push('');
        reasoning.push('╔═══════════════════════════════════════════════════════════════════════╗');
        reasoning.push('║          SELF-HEALING SUPPLY CHAIN - AGENTIC AI FRAMEWORK             ║');
        reasoning.push('║                     COMPLETE PIPELINE SIMULATION                      ║');
        reasoning.push('╚═══════════════════════════════════════════════════════════════════════╝');
        reasoning.push('');
        reasoning.push(`  🕐 Started at: ${new Date().toISOString()}`);
        reasoning.push('  ══════════════════════════════════════════════════════════════════════');
    }

    _printSummary(stageResults, reasoning, startTime) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        reasoning.push('');
        reasoning.push('┌───────────────────────────────────────────────────────────────────────┐');
        reasoning.push('│                    FINAL RESULTS DASHBOARD                           │');
        reasoning.push('└───────────────────────────────────────────────────────────────────────┘');
        reasoning.push('');
        reasoning.push(`  📡 Events Detected:           ${stageResults.EVENT_SENSING?.events?.length || 0}`);
        reasoning.push(`  🔍 Risks Identified:          ${stageResults.RISK_ANALYSIS?.affectedSuppliers?.length || 0}`);
        reasoning.push(`  📋 Recovery Plans Generated:  ${stageResults.RECOVERY_PLANNING?.rankedSuppliers?.length || 0}`);
        reasoning.push(`  📝 Contracts Drafted:         ${stageResults.CONTRACT_DRAFTING?.contract ? 1 : 0}`);
        reasoning.push('');
        reasoning.push(`  ⏱️  Total Duration:           ${duration} seconds`);
        reasoning.push('');
        reasoning.push('  ══════════════════════════════════════════════════════════════════════');
        reasoning.push('  ✨ Self-Healing Supply Chain Simulation Complete!');
        reasoning.push('  ══════════════════════════════════════════════════════════════════════');
    }

    _buildResult(sessionId, success, stageResults, reasoning, startTime, error = null) {
        return {
            sessionId,
            success,
            stageResults,
            reasoning,
            durationMs: Date.now() - startTime,
            error
        };
    }
}

export default new AgentOrchestrator();
