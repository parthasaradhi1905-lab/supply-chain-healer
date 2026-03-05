/**
 * Worker Agent — Event-driven task execution
 * 
 * Subscribes to the 'tasks' channel, dispatches to the correct agent
 * via AgentRegistry, and publishes results to the 'results' channel
 */

import { getAgent } from './AgentRegistry.js';
import { publish, setMemory } from './MemoryBus.js';

/**
 * Execute a single task by dispatching to the registered agent
 * @param {object} task - Task descriptor from PlannerAgent
 * @returns {object} Task result
 */
export async function executeTask(task) {
    const startTime = Date.now();
    const agent = getAgent(task.agent);

    // Log task start
    await publish('logs', {
        event: 'task_start',
        taskId: task.id,
        taskType: task.task,
        agent: task.agent,
    });

    let result;

    try {
        // Dispatch based on task type
        switch (task.task) {
            case 'detect_disruption':
                result = await agent.scanForDisruptions(
                    task.payload.disruptionType,
                    task.payload.orderId
                );
                break;

            case 'predict_risk': {
                // Try ML prediction first, fall back to agent analysis
                let mlPrediction = null;
                try {
                    const mlUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
                    const response = await fetch(`${mlUrl}/predict`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            supplier_reliability: 0.85,
                            weather_risk: task.payload.severity === 'critical' ? 0.9 : 0.5,
                            port_congestion: 0.6,
                            distance: 10000,
                            inventory_level: 0.4,
                            geopolitical_risk: task.payload.severity === 'critical' ? 0.8 : 0.3,
                        }),
                    });
                    mlPrediction = await response.json();
                } catch {
                    // ML service not available — okay
                }

                result = await agent.analyzeImpact(
                    task.payload.disruption,
                    { id: task.payload.orderId, product_name: 'Supply Order', quantity: 10000 }
                );

                if (mlPrediction) {
                    result.mlPrediction = mlPrediction;
                }
                break;
            }

            case 'evaluate_routes':
                result = {
                    affectedRoutes: task.payload.affectedRoutes,
                    transportModes: task.payload.transportModes,
                    alternativeRoutes: ['Cape of Good Hope', 'Trans-Siberian Rail', 'Air Freight Express'],
                    reasoning: [`Evaluating ${task.payload.affectedRoutes.length} affected routes`],
                };
                break;

            case 'find_suppliers':
                result = await agent.findAlternatives(
                    task.payload.quantity,
                    task.payload.excludedSuppliers,
                    { id: task.payload.orderId, product_name: 'Supply Order', quantity: task.payload.quantity }
                );
                break;

            case 'emergency_reroute':
                result = await agent.planLogistics(
                    { id: task.payload.orderId || 1 },
                    { name: 'Emergency Supplier', location: 'Alternative Route' },
                    { delayHours: '24-48', riskLevel: 90 }
                );
                break;

            case 'generate_contract':
                result = await agent.planLogistics(
                    { id: task.payload.orderId || 1 },
                    { name: 'Selected Supplier', location: 'Optimal Route' },
                    { delayHours: '12-24', riskLevel: 60 }
                );
                break;

            default:
                result = { status: 'unknown_task', task: task.task };
        }
    } catch (err) {
        result = {
            status: 'error',
            error: err.message,
            agent: task.agent,
            task: task.task,
        };
    }

    const duration = Date.now() - startTime;

    // Store result in shared memory
    setMemory(`result:${task.id}`, { ...result, duration, taskId: task.id });

    // Publish result
    await publish('results', {
        event: 'task_complete',
        taskId: task.id,
        taskType: task.task,
        agent: task.agent,
        duration,
        success: result.status !== 'error',
    });

    // Log decision for explainability
    await publish('logs', {
        event: 'agent_decision',
        agent: task.agent,
        task: task.task,
        input: task.payload,
        output: typeof result === 'object' ? { ...result, reasoning: undefined } : result,
        confidence: result.riskLevel ? (result.riskLevel / 100) : 0.8,
        duration,
    });

    return { ...result, _taskId: task.id, _duration: duration };
}

export default { executeTask };
