import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import ControlTowerLayout from '../components/layout/ControlTowerLayout';
import { AlertCircle, Shield, Clock, Zap, Bell, Filter, Box } from 'lucide-react';
import api from '../utils/api';

function AlertCenterContent() {
    const { user } = useAuth();
    const [disruptions, setDisruptions] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAlertData();
    }, []);

    const fetchAlertData = async () => {
        try {
            setLoading(true);
            const [disruptionsRes, ordersRes] = await Promise.all([
                api.get('/disruptions/active'),
                api.get('/orders')
            ]);
            setDisruptions(disruptionsRes.data?.disruptions || []);
            setOrders(ordersRes.data?.orders || []);
        } catch (error) {
            console.error('Failed to fetch alerts:', error);
        } finally {
            setLoading(false);
        }
    };

    const syncedAlerts = useMemo(() => {
        if (!orders || orders.length === 0) return [];
        const atRiskOrders = orders.filter(o => o.status === 'at_risk' || o.status === 'delayed');

        return atRiskOrders.map((order, idx) => {
            const supplierLoc = (order.supplier_location || order.supplier_name || '').toLowerCase();

            let matched = disruptions.find(d => {
                const routes = JSON.stringify(d.affected_routes || '').toLowerCase();
                const title = (d.title || '').toLowerCase();
                const desc = (d.impact_description || d.description || '').toLowerCase();
                const locParts = supplierLoc.split(/[,\s]+/).filter(p => p.length > 2);
                return locParts.some(part => routes.includes(part) || title.includes(part) || desc.includes(part));
            });

            if (!matched && disruptions.length > 0) {
                matched = disruptions[idx % disruptions.length];
            }

            const d = matched || {
                type: 'supply_chain_risk',
                severity: 'high',
                title: 'Supply Chain Risk Detected',
                impact_description: `Order for ${order.product_name} is experiencing disruptions.`,
                triggered_at: new Date().toISOString()
            };

            return {
                id: `alert-${order.id}`,
                type: d.type || 'unknown',
                severity: d.severity || 'high',
                title: d.title || (d.type || 'Risk').replace(/_/g, ' '),
                description: d.impact_description || d.description || 'Disruption detected.',
                order,
                timestamp: d.triggered_at || d.created_at || new Date().toISOString()
            };
        });
    }, [orders, disruptions]);

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <div className="w-10 h-10 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Syncing with Orders...</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-200">
                        <Bell className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Alert Center</h1>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Synced with Active Orders</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 px-6 py-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                        <span className="relative flex h-3 w-3">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${syncedAlerts.length > 0 ? 'bg-rose-400' : 'bg-emerald-400'}`}></span>
                            <span className={`relative inline-flex rounded-full h-3 w-3 ${syncedAlerts.length > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                        </span>
                        <span className="text-xs font-black text-slate-600 uppercase tracking-widest">
                            {syncedAlerts.length > 0 ? `${syncedAlerts.length} Action Needed` : 'System Secure'}
                        </span>
                    </div>
                    <button className="h-12 w-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-sm">
                        <Filter className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Alerts Body */}
            {syncedAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/20 text-center">
                    <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6 border-8 border-white shadow-lg">
                        <Shield className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">No Active Disruptions</h3>
                    <p className="text-slate-500 font-medium max-w-md">
                        All your current orders and shipments are proceeding on schedule. No alerts require your attention.
                    </p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {syncedAlerts.map((alert, index) => (
                        <div
                            key={alert.id}
                            className="group bg-white rounded-[32px] border border-rose-100 shadow-xl shadow-rose-900/5 hover:shadow-2xl hover:shadow-rose-900/10 transition-all duration-300 overflow-hidden flex flex-col md:flex-row relative"
                        >
                            <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-rose-500 to-rose-600" />

                            {/* Disruption Info */}
                            <div className="p-8 md:w-2/5 border-b md:border-b-0 md:border-r border-slate-100 bg-rose-50/30 flex flex-col justify-center">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                                        <AlertCircle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">Risk Detected</span>
                                        <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase leading-none mt-1">
                                            {alert.title}
                                        </h3>
                                    </div>
                                </div>

                                <p className="text-sm text-slate-600 font-medium leading-relaxed mb-6">
                                    {alert.description}
                                </p>

                                <div className="flex items-center gap-4">
                                    <span className="px-3 py-1 bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-widest rounded-full">
                                        Severity: {alert.severity}
                                    </span>
                                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5" />
                                        {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>

                            {/* Affected Order Info */}
                            <div className="p-8 md:w-3/5 bg-white flex flex-col justify-center relative">
                                <div className="absolute top-8 right-8 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                    Order #{alert.order.id}
                                </div>

                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Affected Asset</p>

                                <div className="flex items-start gap-5 mb-8">
                                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                        <Box className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-black text-slate-900 tracking-tight mb-2">
                                            {alert.order.quantity || 0}x {alert.order.product_name}
                                        </h4>
                                        <div className="flex flex-wrap gap-4 text-sm font-bold text-slate-500">
                                            <span className="flex items-center gap-1.5 opacity-80">
                                                Value: <span className="text-slate-900">{formatCurrency(alert.order.total_cost)}</span>
                                            </span>
                                            <span className="flex items-center gap-1.5 opacity-80">
                                                ETA: <span className="text-slate-900">{alert.order.expected_delivery ? new Date(alert.order.expected_delivery).toLocaleDateString() : 'N/A'}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 mt-auto pt-6 border-t border-slate-50">
                                    <button className="flex-1 bg-slate-900 text-white h-12 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-95">
                                        View Details
                                    </button>
                                    {user?.role === 'buyer' && (
                                        <button className="flex-1 bg-white border border-slate-200 text-slate-600 h-12 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2">
                                            <Zap className="w-4 h-4 text-amber-500" />
                                            Execute AI Recovery
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function AlertsPage() {
    return (
        <ControlTowerLayout>
            <AlertCenterContent />
        </ControlTowerLayout>
    );
}
