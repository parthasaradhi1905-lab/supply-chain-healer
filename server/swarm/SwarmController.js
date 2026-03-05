/**
 * Swarm Controller — Top-level orchestrator for the autonomous agent swarm
 * 
 * Flow: Plan → Dispatch Workers → Collect Results → Evaluate → Return Best Plan
 * All lifecycle events published to MemoryBus
 */

import { planTasks, getExecutableTasks } from './PlannerAgent.js';
import { executeTask } from './WorkerAgent.js';
import { evaluatePlans } from './EvaluatorAgent.js';
import { publish, setMemory, clearMemory } from './MemoryBus.js';

/**
 * Run the full swarm pipeline for a disruption event
 * @param {object} disruption - Disruption event data
 * @param {object} context - Additional context (orderId, quantity, etc.)
 * @returns {object} Swarm execution result
 */
export async function runSwarm(disruption, context = {}) {
    const sessionId = `swarm-${Date.now()}`;
    const startTime = Date.now();
    const reasoning = [];

    // Clear previous state
    clearMemory();
    setMemory('session', { id: sessionId, startTime: new Date().toISOString() });

    reasoning.push(`[SWARM] ═══════════════════════════════════════`);
    reasoning.push(`[SWARM] Session: ${sessionId}`);
    reasoning.push(`[SWARM] Disruption: ${disruption.title || disruption.type || 'Unknown'}`);
    reasoning.push(`[SWARM] Severity: ${disruption.severity || 'unknown'}`);
    reasoning.push(`[SWARM] ═══════════════════════════════════════`);

    await publish('logs', {
        event: 'swarm_start',
        sessionId,
        disruption: disruption.title,
    });

    // Phase 1: Plan tasks
    reasoning.push(`\n[PLANNER] Decomposing disruption into tasks...`);
    const tasks = planTasks(disruption, context);
    reasoning.push(`[PLANNER] Generated ${tasks.length} tasks:`);
    tasks.forEach(t => {
        reasoning.push(`  ${t.id}: ${t.task} → ${t.agent} (deps: ${t.dependencies.join(', ') || 'none'})`);
    });

    await publish('logs', {
        event: 'tasks_planned',
        sessionId,
        taskCount: tasks.length,
        tasks: tasks.map(t => ({ id: t.id, task: t.task, agent: t.agent })),
    });

    // Phase 2: Execute tasks respecting dependencies
    reasoning.push(`\n[SWARM] Executing task graph...`);
    const completedTasks = [];
    const results = {};
    let iteration = 0;
    const maxIterations = 10;

    while (completedTasks.length < tasks.length && iteration < maxIterations) {
        iteration++;
        const executable = getExecutableTasks(tasks, completedTasks.map(t => t.id));

        if (executable.length === 0) {
            reasoning.push(`[SWARM] ⚠️ No executable tasks found — breaking`);
            break;
        }

        reasoning.push(`[SWARM] Iteration ${iteration}: Executing ${executable.length} task(s) in parallel`);

        // Execute in parallel
        const batchResults = await Promise.allSettled(
            executable.map(async (task) => {
                reasoning.push(`  → ${task.id}: ${task.task} (${task.agent})`);
                const result = await executeTask(task);
                return { task, result };
            })
        );

        // Collect results
        batchResults.forEach(r => {
            if (r.status === 'fulfilled') {
                const { task, result } = r.value;
                completedTasks.push(task);
                results[task.id] = result;
                reasoning.push(`  ✅ ${task.id} complete (${result._duration}ms)`);
            } else {
                reasoning.push(`  ❌ Task failed: ${r.reason?.message || 'unknown error'}`);
            }
        });
    }

    reasoning.push(`\n[SWARM] ${completedTasks.length}/${tasks.length} tasks completed`);

    // Phase 3: Evaluate results
    reasoning.push(`\n[EVALUATOR] Evaluating recovery options...`);

    // Build candidate plans from results
    const candidatePlans = buildCandidatePlans(results, disruption);
    const evaluation = evaluatePlans(candidatePlans);
    reasoning.push(...(evaluation.reasoning || []));

    const duration = Date.now() - startTime;

    await publish('logs', {
        event: 'swarm_complete',
        sessionId,
        duration,
        tasksCompleted: completedTasks.length,
        bestPlan: evaluation.bestPlan?.label,
    });

    reasoning.push(`\n[SWARM] ═══════════════════════════════════════`);
    reasoning.push(`[SWARM] Completed in ${duration}ms`);
    reasoning.push(`[SWARM] Best plan: ${evaluation.bestPlan?.label || 'N/A'}`);
    reasoning.push(`[SWARM] ═══════════════════════════════════════`);

    return {
        sessionId,
        success: completedTasks.length > 0,
        duration,
        tasksPlanned: tasks.length,
        tasksCompleted: completedTasks.length,
        results,
        evaluation,
        reasoning,
    };
}

/**
 * Build candidate recovery plans from task results
 */
function buildCandidatePlans(results, disruption) {
    const plans = [];

    // Plan A: Fast recovery (air freight, premium supplier)
    plans.push({
        label: 'Plan A — Air Freight Express',
        cost: 155000,
        delay: 3,
        risk: 15,
        transportMode: 'air',
        description: 'Premium air freight with nearest available supplier',
        supplier: results.T4?.alternatives?.[0]?.name || 'Premium Supplier',
    });

    // Plan B: Balanced (sea + alternative route)
    plans.push({
        label: 'Plan B — Alternative Sea Route',
        cost: 125000,
        delay: 12,
        risk: 25,
        transportMode: 'sea',
        description: 'Rerouted sea freight via Cape of Good Hope',
        supplier: results.T4?.alternatives?.[1]?.name || 'Alternative Supplier',
    });

    // Plan C: Cost-optimized (longer delay, cheapest supplier)
    plans.push({
        label: 'Plan C — Cost Optimized',
        cost: 98000,
        delay: 21,
        risk: 40,
        transportMode: 'sea',
        description: 'Lowest cost supplier with standard sea freight',
        supplier: results.T4?.alternatives?.[2]?.name || 'Budget Supplier',
    });

    // If critical, add emergency plan
    if (disruption.severity === 'critical') {
        plans.push({
            label: 'Plan D — Emergency Split Order',
            cost: 175000,
            delay: 5,
            risk: 10,
            transportMode: 'air+sea',
            description: 'Split order: 40% air freight + 60% express sea',
            supplier: 'Multiple Suppliers',
        });
    }

    return plans;
}

export default { runSwarm };
