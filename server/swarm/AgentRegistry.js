/**
 * Agent Registry — Central registry for all agents in the swarm
 * Makes the system extensible: register a new agent, it's available to the swarm
 */

import SentinelAgent from '../ai/agents/SentinelAgent.js';
import AnalystAgent from '../ai/agents/AnalystAgent.js';
import NegotiatorAgent from '../ai/agents/NegotiatorAgent.js';
import LogisticsAgent from '../ai/agents/LogisticsAgent.js';
import NewsAgent from '../ai/agents/NewsAgent.js';
import WeatherAgent from '../ai/agents/WeatherAgent.js';

const AgentRegistry = {
    SentinelAgent,
    AnalystAgent,
    NegotiatorAgent,
    LogisticsAgent,
    NewsAgent,
    WeatherAgent,
};

/**
 * Get an agent by name
 * @param {string} name - Agent name (e.g. 'AnalystAgent')
 * @returns {object} Agent instance
 */
export function getAgent(name) {
    const agent = AgentRegistry[name];
    if (!agent) {
        throw new Error(`Agent "${name}" not registered. Available: ${Object.keys(AgentRegistry).join(', ')}`);
    }
    return agent;
}

/**
 * Register a new agent at runtime
 */
export function registerAgent(name, agentInstance) {
    AgentRegistry[name] = agentInstance;
    console.log(`[AgentRegistry] Registered: ${name}`);
}

/**
 * List all registered agents
 */
export function listAgents() {
    return Object.keys(AgentRegistry);
}

export { AgentRegistry };
export default AgentRegistry;
