import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DigitalTwin3D from '../components/DigitalTwin3D';
import Sidebar from '../components/layout/Sidebar';
import axios from 'axios';
import {
    Globe,
    Activity,
    AlertTriangle,
    Boxes,
    RefreshCw,
    Zap,
    Network,
    ChevronRight,
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function DigitalTwinPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [graphData, setGraphData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [disruptions, setDisruptions] = useState([]);
    const [simulatedDisruption, setSimulatedDisruption] = useState('');

    const fetchTwinState = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/twin/state`);
            setGraphData(res.data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch twin state:', err);
            setError('Failed to load Digital Twin data');
            // Fallback demo data
            setGraphData(getDemoData());
        } finally {
            setLoading(false);
        }
    };

    const fetchDisruptions = async () => {
        try {
            const res = await axios.get(`${API}/disruptions`);
            if (res.data) setDisruptions(Array.isArray(res.data) ? res.data : []);
        } catch {
            setDisruptions([]);
        }
    };

    const handleSimulate = async () => {
        if (!simulatedDisruption) return;
        try {
            await axios.post(`${API}/twin/simulate`, {
                affectedRoutes: [simulatedDisruption],
                severity: 'critical',
            });
            await fetchTwinState();
        } catch {
            // Local simulation fallback
            if (graphData) {
                const updated = { ...graphData };
                updated.edges = updated.edges.map(e => {
                    const affected =
                        e.routeLabel?.toLowerCase().includes(simulatedDisruption.toLowerCase()) ||
                        e.source?.toLowerCase().includes(simulatedDisruption.toLowerCase()) ||
                        e.target?.toLowerCase().includes(simulatedDisruption.toLowerCase());
                    return affected ? { ...e, disrupted: true, severity: 'critical' } : e;
                });
                updated.stats = {
                    ...updated.stats,
                    disruptedEdges: updated.edges.filter(e => e.disrupted).length,
                };
                setGraphData(updated);
            }
        }
    };

    const handleReset = async () => {
        try {
            await axios.post(`${API}/twin/reset`);
        } catch {
            // ignore
        }
        await fetchTwinState();
    };

    useEffect(() => {
        fetchTwinState();
        fetchDisruptions();
    }, []);

    const stats = graphData?.stats || {};

    return (
        <div className="flex min-h-screen bg-bg-primary">
            <Sidebar user={user} navigate={navigate} activePage="digital-twin" />
            <main className="flex-1 ml-16 lg:ml-56">
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/5">
                    <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
                        <Globe size={14} />
                        <span>Control Tower</span>
                        <ChevronRight size={12} />
                        <span className="text-accent-teal">Digital Twin</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
                                <Network className="text-accent-teal" size={24} />
                                Supply Chain Digital Twin
                            </h1>
                            <p className="text-text-muted text-sm mt-1">
                                Real-time 3D graph visualization — G = (V, E)
                            </p>
                        </div>
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card-bg border border-white/10 text-text-secondary hover:text-accent-teal hover:border-accent-teal/30 transition-all text-sm"
                        >
                            <RefreshCw size={14} />
                            Reset Graph
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Stats row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                        {[
                            { label: 'Suppliers', value: stats.suppliers || 0, icon: Boxes, color: '#00ff88' },
                            { label: 'Ports', value: stats.ports || 0, icon: Globe, color: '#00bfff' },
                            { label: 'Factories', value: stats.factories || 0, icon: Zap, color: '#ff6600' },
                            { label: 'Warehouses', value: stats.warehouses || 0, icon: Boxes, color: '#ffcc00' },
                            { label: 'Retailers', value: stats.retailers || 0, icon: Activity, color: '#ff44aa' },
                            { label: 'Routes', value: stats.totalEdges || 0, icon: Network, color: '#8888ff' },
                            { label: 'Disrupted', value: stats.disruptedEdges || 0, icon: AlertTriangle, color: stats.disruptedEdges > 0 ? '#ff2222' : '#334466' },
                        ].map((s, i) => (
                            <div
                                key={i}
                                className="px-4 py-3 rounded-xl border border-white/5 bg-card-bg"
                                style={{ borderLeftColor: s.color, borderLeftWidth: 3 }}
                            >
                                <div className="text-[10px] uppercase tracking-wider text-text-muted">{s.label}</div>
                                <div className="text-xl font-bold mt-1" style={{ color: s.color }}>{s.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Simulation controls */}
                    <div className="flex flex-wrap gap-3 items-center">
                        <select
                            value={simulatedDisruption}
                            onChange={(e) => setSimulatedDisruption(e.target.value)}
                            className="px-4 py-2 rounded-lg bg-card-bg border border-white/10 text-text-primary text-sm focus:outline-none focus:border-accent-teal/50"
                        >
                            <option value="">Select disruption to simulate...</option>
                            <option value="suez">Suez Canal Blockage</option>
                            <option value="pacific">Trans-Pacific Storm</option>
                            <option value="shanghai">Port Shanghai Closure</option>
                            <option value="rotterdam">Port Rotterdam Strike</option>
                            <option value="la">Port LA Congestion</option>
                        </select>
                        <button
                            onClick={handleSimulate}
                            disabled={!simulatedDisruption}
                            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <AlertTriangle size={14} />
                            Simulate Disruption
                        </button>
                    </div>

                    {/* 3D Scene */}
                    <div
                        className="rounded-2xl overflow-hidden border border-white/5"
                        style={{ height: 'calc(100vh - 340px)', minHeight: 500 }}
                    >
                        {loading ? (
                            <div className="w-full h-full flex items-center justify-center bg-card-bg">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="spinner w-10 h-10" />
                                    <span className="text-text-muted text-sm">Rendering Digital Twin...</span>
                                </div>
                            </div>
                        ) : error && !graphData ? (
                            <div className="w-full h-full flex items-center justify-center bg-card-bg">
                                <span className="text-red-400">{error}</span>
                            </div>
                        ) : (
                            <DigitalTwin3D graphData={graphData} />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

function getDemoData() {
    return {
        nodes: [
            { type: 'supplier', id: 'supplier-1', label: 'SteelCorp Asia', country: 'China' },
            { type: 'supplier', id: 'supplier-2', label: 'TechForge India', country: 'India' },
            { type: 'supplier', id: 'supplier-3', label: 'Nordic Steel', country: 'Sweden' },
            { type: 'port', id: 'port-shanghai', label: 'Port Shanghai', country: 'China' },
            { type: 'port', id: 'port-singapore', label: 'Port Singapore', country: 'Singapore' },
            { type: 'port', id: 'port-la', label: 'Port Los Angeles', country: 'USA' },
            { type: 'port', id: 'port-rotterdam', label: 'Port Rotterdam', country: 'Netherlands' },
            { type: 'factory', id: 'factory-us', label: 'US Assembly', country: 'USA' },
            { type: 'factory', id: 'factory-de', label: 'EU Assembly', country: 'Germany' },
            { type: 'warehouse', id: 'wh-east', label: 'East Coast DC', country: 'USA' },
            { type: 'warehouse', id: 'wh-west', label: 'West Coast DC', country: 'USA' },
            { type: 'retailer', id: 'retailer-na', label: 'North America', country: 'USA' },
            { type: 'retailer', id: 'retailer-eu', label: 'Europe', country: 'France' },
        ],
        edges: [
            { source: 'supplier-1', target: 'port-shanghai', type: 'shipment_route', mode: 'road' },
            { source: 'supplier-2', target: 'port-singapore', type: 'shipment_route', mode: 'road' },
            { source: 'supplier-3', target: 'port-rotterdam', type: 'shipment_route', mode: 'rail' },
            { source: 'port-shanghai', target: 'port-la', type: 'shipment_route', mode: 'sea', routeLabel: 'Trans-Pacific' },
            { source: 'port-singapore', target: 'port-la', type: 'shipment_route', mode: 'sea', routeLabel: 'Pacific Route' },
            { source: 'port-rotterdam', target: 'port-la', type: 'shipment_route', mode: 'sea', routeLabel: 'Atlantic Route' },
            { source: 'port-la', target: 'factory-us', type: 'shipment_route', mode: 'road' },
            { source: 'port-rotterdam', target: 'factory-de', type: 'shipment_route', mode: 'rail' },
            { source: 'factory-us', target: 'wh-west', type: 'inventory_transfer', mode: 'road' },
            { source: 'factory-us', target: 'wh-east', type: 'inventory_transfer', mode: 'rail' },
            { source: 'factory-de', target: 'retailer-eu', type: 'inventory_transfer', mode: 'road' },
            { source: 'wh-west', target: 'retailer-na', type: 'inventory_transfer', mode: 'road' },
            { source: 'wh-east', target: 'retailer-na', type: 'inventory_transfer', mode: 'road' },
        ],
        stats: { totalNodes: 13, totalEdges: 13, suppliers: 3, ports: 4, factories: 2, warehouses: 2, retailers: 2, disruptedEdges: 0 },
    };
}
