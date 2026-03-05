/**
 * Planner Agent — Task Decomposition for the Swarm
 * 
 * Breaks a disruption event into ordered sub-tasks:
 *   T1: detect_disruption
 *   T2: predict_risk
 *   T3: evaluate_routes
 *   T4: find_suppliers
 *   T5: generate_contract
 */

/**
 * Plan tasks for a disruption event
 * @param {object} disruption - Disruption event data
 * @param {object} context - Additional context (orderId, suppliers, etc.)
 * @returns {Array} Ordered task list
 */
export function planTasks(disruption, context = {}) {
    const orderId = context.orderId || null;
    const severity = disruption.severity || 'medium';

    const tasks = [
        {
            id: 'T1',
            task: 'detect_disruption',
            agent: 'SentinelAgent',
            priority: 1,
            payload: {
                disruptionType: disruption.type || 'LOGISTICS',
                title: disruption.title || 'Unknown disruption',
                orderId,
            },
            dependencies: [],
        },
        {
            id: 'T2',
            task: 'predict_risk',
            agent: 'AnalystAgent',
            priority: 2,
            payload: {
                disruption,
                orderId,
                severity,
            },
            dependencies: ['T1'],
        },
        {
            id: 'T3',
            task: 'evaluate_routes',
            agent: 'AnalystAgent',
            priority: 2,
            payload: {
                affectedRoutes: disruption.affected_routes || [],
                transportModes: disruption.affected_transport_modes || [],
            },
            dependencies: ['T1'],
        },
        {
            id: 'T4',
            task: 'find_suppliers',
            agent: 'NegotiatorAgent',
            priority: 3,
            payload: {
                quantity: context.quantity || 10000,
                excludedSuppliers: context.excludedSuppliers || [],
                orderId,
            },
            dependencies: ['T2', 'T3'],
        },
        {
            id: 'T5',
            task: 'generate_contract',
            agent: 'LogisticsAgent',
            priority: 4,
            payload: {
                orderId,
                disruption,
            },
            dependencies: ['T4'],
        },
    ];

    // For critical disruptions, add an extra fast-track task
    if (severity === 'critical') {
        tasks.splice(3, 0, {
            id: 'T3B',
            task: 'emergency_reroute',
            agent: 'LogisticsAgent',
            priority: 3,
            payload: {
                affectedRoutes: disruption.affected_routes || [],
                urgency: 'immediate',
            },
            dependencies: ['T2'],
        });
    }

    return tasks;
}

/**
 * Get tasks that can run in parallel (no unresolved dependencies)
 */
export function getExecutableTasks(tasks, completedTaskIds = []) {
    return tasks.filter(task => {
        if (completedTaskIds.includes(task.id)) return false;
        return task.dependencies.every(dep => completedTaskIds.includes(dep));
    });
}

export default { planTasks, getExecutableTasks };
