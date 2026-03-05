import { useState, useEffect } from 'react';
import ControlTowerLayout from '../components/layout/ControlTowerLayout';
import SupplyChainGlobe from '../components/SupplyChainGlobe';
import CrisisControlPanel from '../components/CrisisControlPanel';
import GlobalRiskRadar from '../components/GlobalRiskRadar';
import RiskDashboard from '../components/RiskDashboard';
import { Ship, AlertTriangle, Zap, Package, Play, RotateCcw, Activity } from 'lucide-react';
import api from '../utils/api';

// ─── Card primitives (Copied from Buyer Dashboard for consistency) ───
function Card({ children, className = "" }) {
    return <div className={`premium-card overflow-hidden bg-white border border-slate-100 rounded-2xl shadow-sm ${className}`}>{children}</div>;
}
function CardHeader({ children, className = "" }) {
    return (
        <div className={`px-6 py-5 border-b border-slate-50 flex items-center justify-between ${className}`}>
            {children}
        </div>
    );
}
function CardBody({ children, className = "" }) {
    return <div className={`p-6 ${className}`}>{children}</div>;
}

export default function AdminDashboard() {
    const [orders, setOrders] = useState([]);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [agentLogs, setAgentLogs] = useState([]);
    const [isTerminalOpen, setIsTerminalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentCrisis, setCurrentCrisis] = useState(null);
    const [showCrisisModal, setShowCrisisModal] = useState(false);
    const [shipments, setShipments] = useState([
        {
            id: 'SZX-219',
            route: 'Shanghai Port → Singapore Hub',
            transport_mode: 'Ocean Freight',
            status: 'in_transit',
            eta: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 'SZX-220',
            route: 'Singapore Hub → Detroit Factory',
            transport_mode: 'Air Freight',
            status: 'pending',
            eta: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()
        }
    ]);
    const [disruptions, setDisruptions] = useState([]);
    const [radarData, setRadarData] = useState([]);
    const [storms, setStorms] = useState([]);

    useEffect(() => {
        loadOrders();

        // Connect to WebSocket to consume Logistics Engine & Disaster Engine streams
        const ws = new WebSocket("ws://localhost:8080");
        ws.onmessage = (event) => {
            try {
                const parsed = JSON.parse(event.data);
                if (parsed.type === "stream:shipments") {
                    setShipments(parsed.payload);
                } else if (parsed.type === "stream:disruptions") {
                    setDisruptions(prev => [...prev, parsed.payload]);
                    setAgentLogs(logs => [
                        ...logs,
                        `[SENTINEL] Disruption Event Detected: ${parsed.payload.type} at ${parsed.payload.location}`
                    ]);
                } else if (parsed.type === "stream:risk_radar") {
                    setRadarData(parsed.payload.ranked || []);
                } else if (parsed.type === "stream:storms") {
                    setStorms(parsed.payload || []);
                }
            } catch (err) {
                console.error(err);
            }
        };
        return () => ws.close();
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
        // Remove terminal opening for layout consistency - ControlTowerLayout handles this natively
        // setIsTerminalOpen(true);

        try {
            // Update shipment visually
            setShipments(prev => prev.map(s =>
                s.id === 'SZX-219' ? { ...s, status: 'delayed', route: 'Shanghai Port ⚠️ → Singapore Hub' } : s
            ));

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
        setShipments([
            {
                id: 'SZX-219',
                route: 'Shanghai Port → Singapore Hub',
                transport_mode: 'Ocean Freight',
                status: 'in_transit',
                eta: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'SZX-220',
                route: 'Singapore Hub → Detroit Factory',
                transport_mode: 'Air Freight',
                status: 'pending',
                eta: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()
            }
        ]);
        loadOrders();
    };

    const handleSpeedChange = async (e) => {
        const speed = e.target.value;
        try {
            await api.post('/simulator/speed', { speed });
            console.log(`Speed set to ${speed}x`);

            // Log to terminal for immersion
            setAgentLogs(logs => [
                ...logs,
                `[SYSTEM] Time dilation set to ${speed}x`
            ]);
        } catch (error) {
            console.error('Failed to set speed:', error);
        }
    };

    return (
        <ControlTowerLayout>
            {({ addTerminalLog, setShowTerminal }) => (
                <div className="min-h-screen font-sans text-slate-900 bg-slate-50/50 -m-8 p-8">
                    {/* Admin Header */}
                    <div className="flex justify-between items-end mb-10">
                        <div>
                            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-none">
                                Admin Control Tower
                            </h1>
                            <p className="text-slate-500 font-medium mt-3 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-blue-500" />
                                Trigger disruptions and watch the <span className="text-slate-900 font-bold">AI agents</span> autonomously resolve supply chain crises
                            </p>
                        </div>
                    </div>

                    {/* Live Risk Dashboard */}
                    <div className="mb-8">
                        <RiskDashboard />
                    </div>

                    {/* Main Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* Order Selection */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                        <Package className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <span className="text-lg font-bold text-slate-900 tracking-tight">Select Target Order</span>
                                </div>
                            </CardHeader>
                            <CardBody className="space-y-3">
                                {orders.map((order) => (
                                    <button
                                        key={order.id}
                                        onClick={() => setSelectedOrderId(order.id)}
                                        className={`w-full text-left p-4 rounded-xl border transition-all ${selectedOrderId === order.id
                                            ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                                            : 'border-slate-100 hover:border-slate-300 bg-white'
                                            }`}
                                    >
                                        <div className="font-bold text-slate-900 mb-1">
                                            Order #{order.id.toString().padStart(4, '0')}
                                        </div>
                                        <div className="text-sm font-medium text-slate-600">
                                            {order.product_name}
                                        </div>
                                        <div className="text-xs text-slate-400 mt-2 flex items-center gap-1 font-semibold uppercase tracking-wider">
                                            Quantity: {order.quantity.toLocaleString()} units
                                        </div>
                                    </button>
                                ))}
                            </CardBody>
                        </Card>

                        <div className="lg:col-span-2">
                            <CrisisControlPanel />
                        </div>

                        {/* Global Risk Radar Dashboard */}
                        <Card className="lg:col-span-1 h-[600px] flex flex-col">
                            <CardBody className="p-0 flex-1 overflow-hidden relative">
                                <GlobalRiskRadar radarData={radarData} />
                            </CardBody>
                        </Card>

                        {/* Global Supply Chain Map */}
                        <Card className="lg:col-span-2 h-[600px] flex flex-col">
                            <CardBody className="p-0 flex-1 overflow-hidden relative bg-slate-900 rounded-b-2xl">
                                <SupplyChainGlobe shipments={shipments} disruptions={disruptions} radarData={radarData} storms={storms} />
                            </CardBody>
                        </Card>
                    </div>

                    {/* Status Panel */}
                    <Card className="mb-24">
                        <CardBody>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Simulation Status:</span>
                                        <span className={`flex items-center gap-2 font-bold text-sm ${isProcessing ? 'text-amber-600 bg-amber-50 px-3 py-1 rounded-full' : 'text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full'
                                            }`}>
                                            <span className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-amber-600 animate-pulse' : 'bg-emerald-600'
                                                }`}></span>
                                            {isProcessing ? 'Agent Computing...' : 'Standing By'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <select
                                        onChange={handleSpeedChange}
                                        className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 font-medium outline-none"
                                        defaultValue="1"
                                    >
                                        <option value="1">1x Speed</option>
                                        <option value="5">5x Speed</option>
                                        <option value="10">10x Speed</option>
                                    </select>

                                    <button
                                        onClick={resetSimulation}
                                        className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-sm px-4 py-2.5 rounded-xl transition-colors shadow-sm flex items-center gap-2"
                                    >
                                        <RotateCcw className="w-4 h-4 text-slate-500" />
                                        Reset Flow
                                    </button>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            )}
        </ControlTowerLayout>
    );
}
