import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import AgentTerminal from '../components/AgentTerminal';
import CrisisModal from '../components/CrisisModal';
import { Ship, AlertTriangle, Zap, Package, Play, RotateCcw } from 'lucide-react';
import api from '../utils/api';

export default function AdminDashboard() {
    const [orders, setOrders] = useState([]);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [agentLogs, setAgentLogs] = useState([]);
    const [isTerminalOpen, setIsTerminalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentCrisis, setCurrentCrisis] = useState(null);
    const [showCrisisModal, setShowCrisisModal] = useState(false);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            // Mock orders for demo
            const mockOrders = [
                {
                    id: 1,
                    product_name: 'Industrial Microcontrollers',
                    quantity: 10000,
                    status: 'active',
                    buyer_company: 'ACME Manufacturing Corp',
                },
                {
                    id: 2,
                    product_name: 'Circuit Boards',
                    quantity: 5000,
                    status: 'active',
                    buyer_company: 'ACME Manufacturing Corp',
                },
            ];
            setOrders(mockOrders);
            if (mockOrders.length > 0) {
                setSelectedOrderId(mockOrders[0].id);
            }
        } catch (error) {
            console.error('Failed to load orders:', error);
        }
    };

    const triggerCrisis = async (disruptionType) => {
        if (!selectedOrderId) {
            alert('Please select an order first');
            return;
        }

        setIsProcessing(true);
        setAgentLogs([]);
        setIsTerminalOpen(true);

        try {
            // Call AI endpoint
            const response = await api.post('/ai/trigger-crisis', {
                disruptionType,
                orderId: selectedOrderId,
            });

            // Display reasoning in terminal
            setAgentLogs(response.data.reasoning || []);

            // Show crisis modal with plans
            if (response.data.success && response.data.planB) {
                setCurrentCrisis({
                    disruption: {
                        title: getDisruptionTitle(disruptionType),
                        type: disruptionType,
                        severity: 'critical',
                    },
                    plans: [response.data.planA, response.data.planB],
                });
                setShowCrisisModal(true);
            }
        } catch (error) {
            console.error('Failed to trigger crisis:', error);
            setAgentLogs([
                ...agentLogs,
                '[ERROR] Failed to execute crisis response',
                `[ERROR] ${error.message}`,
            ]);
        } finally {
            setIsProcessing(false);
        }
    };

    const getDisruptionTitle = (type) => {
        const titles = {
            suez_blockage: 'Suez Canal Blockage - Critical Delay',
            hurricane: 'Hurricane Warning - Pacific Northwest',
            labor_strike: 'Port Workers Strike - Los Angeles',
        };
        return titles[type] || 'Supply Chain Disruption';
    };

    const handleAcceptPlan = async (plan) => {
        try {
            await api.post('/ai/accept-plan', {
                planId: plan.id,
                orderId: selectedOrderId,
            });

            setAgentLogs([
                ...agentLogs,
                '',
                '[ORCHESTRATOR] ✅ Plan accepted by buyer',
                '[ORCHESTRATOR] Updating order status to "recovered"',
                '[ORCHESTRATOR] Crisis resolution complete!',
            ]);

            setShowCrisisModal(false);
        } catch (error) {
            console.error('Failed to accept plan:', error);
        }
    };

    const handleRejectPlan = async (planId, reason) => {
        try {
            const response = await api.post('/ai/reject-plan', {
                planId,
                reason,
                orderId: selectedOrderId,
            });

            // Add rejection reasoning to terminal
            const newLogs = response.data.reasoning || [];
            setAgentLogs([...agentLogs, '', ...newLogs]);

            // Show Plan C
            if (response.data.success && response.data.newPlan) {
                setCurrentCrisis({
                    ...currentCrisis,
                    plans: [currentCrisis.plans[0], response.data.newPlan],
                });
            } else {
                setAgentLogs([
                    ...agentLogs,
                    '',
                    '[ORCHESTRATOR] ⚠️ No more alternatives available',
                ]);
                setShowCrisisModal(false);
            }
        } catch (error) {
            console.error('Failed to reject plan:', error);
        }
    };

    const resetSimulation = () => {
        setAgentLogs([]);
        setIsTerminalOpen(false);
        setShowCrisisModal(false);
        setCurrentCrisis(null);
        loadOrders();
    };

    return (
        <div className="min-h-screen bg-bg-primary p-6">
            <div className="max-w-7xl mx-auto">
                <Navbar />

                {/* Admin Header */}
                <div className="glass-card-light p-6 mb-6">
                    <h1 className="text-3xl font-heading mb-2 bg-gradient-to-r from-accent-primary to-accent-success bg-clip-text text-transparent">
                        🎮 ADMIN SIMULATION CONTROL
                    </h1>
                    <p className="text-text-secondary">
                        Trigger disruptions and watch the AI agents autonomously resolve supply chain crises
                    </p>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Order Selection */}
                    <div className="glass-card-light p-6">
                        <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                            <Package className="w-5 h-5 text-accent-primary" />
                            Select Target Order
                        </h3>

                        <div className="space-y-3">
                            {orders.map((order) => (
                                <button
                                    key={order.id}
                                    onClick={() => setSelectedOrderId(order.id)}
                                    className={`w-full text-left p-4 rounded-lg border transition-all ${selectedOrderId === order.id
                                        ? 'border-accent-primary bg-accent-primary/10'
                                        : 'border-accent-primary/20 hover:border-accent-primary/40'
                                        }`}
                                >
                                    <div className="font-semibold text-text-primary mb-1">
                                        Order #{order.id.toString().padStart(4, '0')}
                                    </div>
                                    <div className="text-sm text-text-secondary">
                                        {order.product_name}
                                    </div>
                                    <div className="text-xs text-text-muted mt-1">
                                        Quantity: {order.quantity.toLocaleString()} units
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Disruption Triggers */}
                    <div className="glass-card-light p-6 lg:col-span-2">
                        <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-accent-danger" />
                            Trigger Disruption Scenario
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Suez Blockage */}
                            <button
                                onClick={() => triggerCrisis('suez_blockage')}
                                disabled={isProcessing || !selectedOrderId}
                                className="btn-danger flex flex-col items-center gap-3 py-6 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Ship className="w-12 h-12" />
                                <div className="text-center">
                                    <div className="font-bold text-lg">⚓ Suez Canal</div>
                                    <div className="text-xs opacity-80 mt-1">Blockage</div>
                                </div>
                            </button>

                            {/* Hurricane */}
                            <button
                                onClick={() => triggerCrisis('hurricane')}
                                disabled={isProcessing || !selectedOrderId}
                                className="btn-danger flex flex-col items-center gap-3 py-6 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <AlertTriangle className="w-12 h-12" />
                                <div className="text-center">
                                    <div className="font-bold text-lg">🌀 Hurricane</div>
                                    <div className="text-xs opacity-80 mt-1">Pacific NW</div>
                                </div>
                            </button>

                            {/* Labor Strike */}
                            <button
                                onClick={() => triggerCrisis('labor_strike')}
                                disabled={isProcessing || !selectedOrderId}
                                className="btn-danger flex flex-col items-center gap-3 py-6 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Zap className="w-12 h-12" />
                                <div className="text-center">
                                    <div className="font-bold text-lg">📦 Labor Strike</div>
                                    <div className="text-xs opacity-80 mt-1">LA Ports</div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Status Panel */}
                <div className="glass-card-light p-6 mb-24">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-text-secondary">Agent Status:</span>
                                <span className={`flex items-center gap-2 font-semibold ${isProcessing ? 'text-accent-warning' : 'text-accent-success'
                                    }`}>
                                    <span className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-accent-warning animate-pulse' : 'bg-accent-success'
                                        }`}></span>
                                    {isProcessing ? 'Processing...' : 'Ready'}
                                </span>
                            </div>
                            <div className="text-sm text-text-muted">
                                Terminal: {isTerminalOpen ? 'Open' : 'Closed'}
                            </div>
                        </div>

                        <button
                            onClick={resetSimulation}
                            className="btn-secondary flex items-center gap-2"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Reset Simulation
                        </button>
                    </div>
                </div>

                {/* Agent Terminal */}
                <AgentTerminal
                    logs={agentLogs}
                    isOpen={isTerminalOpen}
                    onToggle={() => setIsTerminalOpen(!isTerminalOpen)}
                    onClose={() => setIsTerminalOpen(false)}
                />

                {/* Crisis Modal */}
                {showCrisisModal && currentCrisis && (
                    <CrisisModal
                        disruption={currentCrisis.disruption}
                        plans={currentCrisis.plans}
                        onClose={() => setShowCrisisModal(false)}
                        onAccept={handleAcceptPlan}
                        onReject={handleRejectPlan}
                    />
                )}
            </div>
        </div>
    );
}
