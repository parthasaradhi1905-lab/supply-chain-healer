import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import ControlTowerLayout from '../components/layout/ControlTowerLayout';
import PlaceOrderModal from '../components/orders/PlaceOrderModal';
import ViewInvoiceModal from '../components/invoices/ViewInvoiceModal';
import {
    Package, TrendingUp, Clock, DollarSign, Plus, MapPin,
    AlertTriangle, Activity, Target, Truck, Calendar, Bell, Check,
    ShoppingCart, BarChart3, ArrowUpRight, ArrowDownRight, Navigation,
    Eye, ChevronLeft, ChevronRight, Layers, Search, Filter, X
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../utils/api';

// ─── Design Tokens (Simplified for use with Tailwind and global CSS) ───
const T = {
    slate900: '#0F172A',
    slate600: '#475569',
    slate400: '#94A3B8',
    blue600: '#2563EB',
    emerald600: '#059669',
    rose600: '#E11D48',
    amber600: '#D97706',
    indigo600: '#4F46E5',
    // UI tokens used by the dashboard
    card: '#FFFFFF',
    cardBorder: '#E2E8F0',
    border: '#F1F5F9',
    text: '#0F172A',
    textMuted: '#94A3B8',
    red: '#E11D48',
    redLight: '#FFF1F2',
    rowHover: '#F8FAFC',
    shadowLg: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05)',
};

// ─── Live Clock ────────────────────────────────────────────────
function LiveClock() {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    return (
        <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text, fontFamily: 'monospace' }}>
                {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </div>
            <div style={{ fontSize: 11, color: T.textMuted, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                <Calendar style={{ width: 11, height: 11 }} />
                {time.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
        </div>
    );
}

// ─── KPI Stat Card (Premium) ──────────────────────────────────
function KPICard({ title, value, change, changeLabel, icon: Icon, iconColor, variant = 'blue' }) {
    const isPositive = change >= 0;

    // Mini sparkline data
    const sparkData = useMemo(() =>
        Array.from({ length: 6 }, () => Math.floor(Math.random() * 100)), []
    );

    return (
        <div className="premium-card p-6 flex flex-col gap-4 relative overflow-hidden group">
            {/* Background Glow */}
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-10 transition-opacity group-hover:opacity-20 bg-${variant}-500`} />

            <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{title}</span>
                    <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</div>
                </div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg shadow-slate-200`}>
                    <Icon className="w-6 h-6" style={{ color: iconColor }} />
                </div>
            </div>

            <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1.5">
                    <div className={`flex items-center px-2 py-0.5 rounded-lg text-[11px] font-bold ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                        {isPositive ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                        {Math.abs(change)}%
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">{changeLabel || 'vs month'}</span>
                </div>

                {/* Tiny Sparkline Placeholder */}
                <div className="flex gap-0.5 items-end h-6">
                    {sparkData.map((h, i) => (
                        <div key={i} className={`w-1 rounded-full opacity-30 bg-slate-400`} style={{ height: `${20 + h / 2}%` }} />
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Status Badge (Premium) ────────────────────────────────────
function StatusBadge({ status, invoice }) {
    if (invoice) {
        if (invoice.status === 'approved') return <span className="status-pill status-pill-success">Paid</span>;
        if (invoice.status === 'pending_approval') return <span className="status-pill status-pill-warning">Invoice Pending</span>;
        if (invoice.status === 'rejected') return <span className="status-pill status-pill-danger">Invoice Rejected</span>;
    }

    const config = {
        active: 'status-pill-blue',
        processing: 'status-pill-warning',
        pending_invoice: 'status-pill-blue',
        fulfilled: 'status-pill-success',
        delivered: 'status-pill-success',
        in_transit: 'status-pill-blue',
        shipped: 'status-pill-blue',
        at_risk: 'status-pill-danger',
        recovered: 'status-pill-success',
        completed: 'status-pill-success',
        pending: 'status-pill-warning',
        cancelled: 'bg-slate-50 text-slate-400 border border-slate-100 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider',
    };

    const className = config[status] || 'bg-slate-50 text-slate-400 border border-slate-100 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider';
    return (
        <span className={`status-pill ${className}`}>
            {status.replace('_', ' ')}
        </span>
    );
}

// ─── Card primitives ───────────────────────────────────────────
// ─── Card primitives (Simplified) ─────────────────────────────
function Card({ children, className = "" }) {
    return <div className={`premium-card overflow-hidden ${className}`}>{children}</div>;
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

// ═══════════════════════════════════════════════════════════════
// ─── BUYER DASHBOARD ──────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════
export default function BuyerDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { formatCurrency, formatDate: settingsFormatDate, formatFriendlyDate, refreshIntervalMs } = useSettings();

    // Existing state — preserved exactly
    const [orders, setOrders] = useState([]);
    const [shipments, setShipments] = useState([]);
    const [disruptions, setDisruptions] = useState([]);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [kpis, setKpis] = useState({
        productionRisk: 0,
        inventoryDays: 36,
        activeOrders: 0,
        costSavings: 0,
        recoveryRate: 100,
    });

    // Invoice state
    const [showViewInvoice, setShowViewInvoice] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [invoices, setInvoices] = useState([]);

    // Alert dropdown
    const [showAlerts, setShowAlerts] = useState(false);

    const layoutRef = useRef(null);

    // ─── Data Loading ──────────────────────────────────────────
    useEffect(() => {
        loadDashboardData();
        const interval = setInterval(loadDashboardData, refreshIntervalMs);
        return () => clearInterval(interval);
    }, [user, refreshIntervalMs]);

    const loadDashboardData = async () => {
        try {
            const [ordersRes, disruptionsRes, shipmentsRes] = await Promise.all([
                api.get('/orders'),
                api.get('/disruptions/active'),
                api.get('/shipments')
            ]);

            const fetchedOrders = ordersRes.data?.orders || [];

            // Fetch invoices for each order
            const invoicePromises = fetchedOrders.map(o =>
                api.get(`/invoices/order/${o.id}`).catch(() => ({ data: { success: false } }))
            );
            const invoiceResults = await Promise.all(invoicePromises);
            const fetchedInvoices = invoiceResults
                .filter(r => r.data?.success && r.data?.invoice)
                .map(r => r.data.invoice);

            const activeDisruptions = disruptionsRes.data?.disruptions || [];
            const fetchedShipments = shipmentsRes.data?.shipments || [];

            setInvoices(fetchedInvoices);
            setShipments(fetchedShipments);

            fetchedOrders.sort((a, b) => a.id - b.id);
            setOrders(fetchedOrders.length > 0 ? fetchedOrders : []);

            // Calculate Dynamic Production Risk (based on actual at-risk order ratio)
            const atRiskOrders = fetchedOrders.filter(o => o.status === 'at_risk' || o.status === 'delayed').length;
            const totalOrders = fetchedOrders.length || 1;
            let risk = Math.round((atRiskOrders / totalOrders) * 100);

            // Small boost for active disruptions (max +5% each)
            if (activeDisruptions.length > 0) {
                setDisruptions(activeDisruptions);
                risk += Math.min(activeDisruptions.length * 3, 10);
            } else {
                setDisruptions([]);
            }

            risk = Math.min(Math.round(risk), 98);

            const activeCount = fetchedOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length;

            // Calculate Profit (Assumption: 20% margin on orders)
            // In a real app, this would come from the backend or be calculated from cost vs revenue
            const totalCost = fetchedOrders.reduce((sum, o) => sum + (o.total_cost || 0), 0);
            const estimatedProfit = Math.round(totalCost * 0.22); // 22% profit margin

            // Calculate Recovery Rate (orders NOT at risk / total orders)
            const healthyOrders = fetchedOrders.filter(o => o.status !== 'at_risk' && o.status !== 'delayed').length;
            const recoveryPct = totalOrders > 0 ? Math.round((healthyOrders / totalOrders) * 100) : 100;

            setKpis(prev => ({
                ...prev,
                activeOrders: activeCount,
                productionRisk: risk,
                profitGained: estimatedProfit,
                recoveryRate: recoveryPct,
            }));
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            setOrders([]);
            setShipments([]);
        }
    };

    // ─── Order Handling (preserved) ────────────────────────────
    const handlePlaceOrder = async (orderData) => {
        try {
            await api.post('/orders', orderData);
            setShowOrderModal(false);
            loadDashboardData();
        } catch (error) {
            console.error('Failed to place order:', error);
        }
    };

    // ─── Chart Data ────────────────────────────────────────────
    const orderChartData = useMemo(() => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        return months.map((month, i) => {
            const placed = Math.max(1, orders.length - i + Math.floor(Math.random() * 2));
            // Add profit data to chart
            return {
                month,
                placed,
                received: Math.max(0, Math.floor((orders.length - i) * 0.6)),
                profit: Math.floor(placed * 0.5 + Math.random() * 0.2) // Mock profit relative to orders layout
            };
        });
    }, [orders.length]);

    // ─── Computed Stats ────────────────────────────────────────
    const stats = useMemo(() => {
        const totalValue = orders.reduce((sum, o) => sum + (o.total_cost || 0), 0);
        const profit = kpis.profitGained || 0;
        const delivered = shipments.filter(s => s.status === 'delivered').length;
        const inTransit = shipments.filter(s => s.status !== 'delivered').length;
        return { totalValue, profit, delivered, inTransit };
    }, [orders, shipments, kpis.profitGained]);

    // ═══════════════════════════════════════════════════════════
    // ─── RENDER ───────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════
    return (
        <ControlTowerLayout>
            {({ addTerminalLog, setShowTerminal }) => (
                <>
                    {/* Light-themed content wrapper */}
                    <div className="min-h-screen font-sans text-slate-900 bg-slate-50/50 -m-8 p-8">
                        {/* ═══ HEADER ═══════════════════════════════════ */}
                        <div className="flex justify-between items-end mb-10">
                            <div>
                                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-none">
                                    Buyer Dashboard
                                </h1>
                                <p className="text-slate-500 font-medium mt-3 flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-blue-500" />
                                    Orchestrating <span className="text-slate-900 font-bold">{orders.length}</span> active orders across global routes
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setShowOrderModal(true)}
                                    className="btn-premium py-3 px-6 shadow-xl shadow-blue-500/20 bg-blue-600 hover:bg-blue-700"
                                >
                                    <Plus className="w-5 h-5" />
                                    <span>New Procurement</span>
                                </button>

                                {/* Alert Bell */}
                                <div style={{ position: 'relative' }}>
                                    <button
                                        onClick={() => setShowAlerts(!showAlerts)}
                                        style={{
                                            width: 42, height: 42, borderRadius: 12, border: `1px solid ${T.cardBorder}`,
                                            background: disruptions.length > 0 ? T.redLight : T.card,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                        }}
                                    >
                                        <Bell style={{ width: 18, height: 18, color: disruptions.length > 0 ? T.red : T.textMuted }} />
                                    </button>
                                    {disruptions.length > 0 && (
                                        <span style={{
                                            position: 'absolute', top: -4, right: -4, width: 20, height: 20,
                                            background: T.red, borderRadius: '50%', fontSize: 11, color: '#fff',
                                            fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            {disruptions.length}
                                        </span>
                                    )}

                                    {/* Alert Dropdown */}
                                    {showAlerts && disruptions.length > 0 && (
                                        <div style={{
                                            position: 'absolute', right: 0, top: 52, width: 340, zIndex: 50,
                                            background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 16,
                                            boxShadow: T.shadowLg, overflow: 'hidden',
                                        }}>
                                            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <h4 style={{ fontSize: 14, fontWeight: 700, color: T.red, display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                                                    <AlertTriangle style={{ width: 16, height: 16 }} />
                                                    Active Alerts ({disruptions.length})
                                                </h4>
                                                <button onClick={() => setShowAlerts(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                                                    <X style={{ width: 14, height: 14, color: T.textMuted }} />
                                                </button>
                                            </div>
                                            <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                                                {disruptions.map((d) => (
                                                    <button
                                                        key={d.id}
                                                        onClick={() => { navigate('/track'); setShowAlerts(false); }}
                                                        style={{
                                                            width: '100%', textAlign: 'left', padding: '14px 18px',
                                                            borderBottom: `1px solid ${T.border}`, background: 'none', border: 'none',
                                                            cursor: 'pointer', transition: 'background 0.15s',
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.background = T.rowHover}
                                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                    >
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{d.title || d.type}</span>
                                                            <span style={{
                                                                padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700,
                                                                background: d.severity === 'high' || d.severity === 'critical' ? T.redLight : T.orangeLight,
                                                                color: d.severity === 'high' || d.severity === 'critical' ? T.red : T.orange,
                                                            }}>
                                                                {d.severity?.toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <p style={{ fontSize: 12, color: T.textMuted, margin: '6px 0 0' }}>
                                                            {d.impact_description || d.description || 'Supply chain disruption detected'}
                                                        </p>
                                                        <p style={{ fontSize: 11, color: T.accent, marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            <Truck style={{ width: 12, height: 12 }} /> Click to view affected shipment
                                                        </p>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <LiveClock />
                            </div>
                        </div>

                        {/* ═══ KPI ROW ══════════════════════════════════ */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                            <KPICard
                                title="Production Risk"
                                value={`${kpis.productionRisk}%`}
                                change={kpis.productionRisk > 20 ? 12 : -5}
                                changeLabel={kpis.productionRisk > 20 ? 'elevated' : 'stable'}
                                icon={AlertTriangle}
                                iconColor={kpis.productionRisk > 20 ? T.rose600 : T.emerald600}
                                variant={kpis.productionRisk > 20 ? 'rose' : 'emerald'}
                            />
                            <KPICard
                                title="Profit Gained"
                                value={formatCurrency(kpis.profitGained || 0)}
                                change={12.5}
                                changeLabel="vs month"
                                icon={DollarSign}
                                iconColor={T.emerald600}
                                variant="emerald"
                            />
                            <KPICard
                                title="Active Orders"
                                value={kpis.activeOrders}
                                change={5.2}
                                icon={Activity}
                                iconColor={T.amber600}
                                variant="amber"
                            />
                            <KPICard
                                title="Recovery Rate"
                                value={`${kpis.recoveryRate}%`}
                                change={1.8}
                                icon={Target}
                                iconColor={T.indigo600}
                                variant="indigo"
                            />
                        </div>

                        {/* ═══ MAIN GRID: Chart + Shipments ═════════════ */}
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>

                            {/* ─── Order Analytics Chart ─────────────── */}
                            <Card className="col-span-1 lg:col-span-2">
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                            <BarChart3 className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <span className="text-lg font-bold text-slate-900 tracking-tight">Supply Chain Performance</span>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        {[
                                            { label: 'Orders', color: T.blue600 },
                                            { label: 'Fullfilled', color: T.emerald600 },
                                            { label: 'Profit', color: T.indigo600 }
                                        ].map(legend => (
                                            <div key={legend.label} className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: legend.color }} />
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{legend.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardHeader>
                                <CardBody>
                                    <div className="h-[280px] w-full mt-4">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={orderChartData} barGap={8}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                                <XAxis
                                                    dataKey="month"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 600 }}
                                                    dy={10}
                                                />
                                                <YAxis
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 600 }}
                                                />
                                                <Tooltip
                                                    cursor={{ fill: '#F8FAFC' }}
                                                    contentStyle={{
                                                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                        backdropFilter: 'blur(12px)',
                                                        borderRadius: '16px',
                                                        border: '1px solid #F1F5F9',
                                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                                        padding: '12px 16px',
                                                    }}
                                                />
                                                <Bar dataKey="placed" fill={T.blue600} radius={[6, 6, 0, 0]} barSize={24} />
                                                <Bar dataKey="received" fill={T.emerald600} radius={[6, 6, 0, 0]} barSize={24} />
                                                <Bar dataKey="profit" fill={T.indigo600} radius={[6, 6, 0, 0]} barSize={24} name="Profit ($)" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="grid grid-cols-3 gap-6 mt-10">
                                        {[
                                            { label: 'Total Spend', value: formatCurrency(stats.totalValue), color: 'text-slate-900' },
                                            { label: 'Profit Gained', value: formatCurrency(stats.profit || 0), color: 'text-indigo-600' },
                                            { label: 'Active Transit', value: stats.inTransit, color: 'text-blue-600' }
                                        ].map(item => (
                                            <div key={item.label} className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100/50">
                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{item.label}</p>
                                                <p className={`text-2xl font-extrabold tracking-tight ${item.color}`}>{item.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </CardBody>
                            </Card>

                            {/* ─── Shipment Tracker ──────────────────── */}
                            <Card className="flex flex-col">
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                                            <Truck className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <span className="text-lg font-bold text-slate-900 tracking-tight">Logistic Flows</span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{shipments.length} tracked</span>
                                </CardHeader>
                                <CardBody className="flex-1 max-h-[460px] overflow-y-auto space-y-6 pt-4">
                                    {shipments.map((shipment) => (
                                        <div key={shipment.id} className="group cursor-pointer">
                                            <div className="flex justify-between items-center mb-3">
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                                        {shipment.route}
                                                    </span>
                                                    <span className="text-[11px] text-slate-400 font-medium">#{shipment.id.toString().slice(-4)}</span>
                                                </div>
                                                <StatusBadge status={shipment.status} />
                                            </div>

                                            <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                                                <div
                                                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-1000"
                                                    style={{ width: `${shipment.progress || (shipment.status === 'delivered' ? 100 : 50)}%` }}
                                                />
                                            </div>

                                            <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-wider">
                                                <div className="flex items-center gap-2 text-slate-500">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                                    {shipment.current_location}
                                                </div>
                                                <div className="text-slate-400">
                                                    ETA <span className="text-slate-700">{formatFriendlyDate(shipment.eta)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {shipments.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-20 opacity-30">
                                            <Navigation className="w-12 h-12 mb-4" />
                                            <p className="text-sm font-bold uppercase tracking-widest">No Active Flows</p>
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </div>

                        {/* ═══ ACTIVE ORDERS TABLE ══════════════════════ */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                                        <Layers className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="text-lg font-bold text-slate-900 tracking-tight">Active Procurement Orders</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="px-4 py-1.5 rounded-xl bg-blue-50 text-blue-600 text-[11px] font-bold uppercase tracking-widest border border-blue-100">
                                        {orders.length} ACTIVE
                                    </span>
                                </div>
                            </CardHeader>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-slate-50/50 border-b border-slate-100">
                                            {['Reference', 'Product Name', 'Quantity', 'Status', 'Financials', 'Estimated Arrival'].map(h => (
                                                <th key={h} className="text-left px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {orders.map((order) => {
                                            const invoice = invoices.find(i => i.order_id === order.id);
                                            return (
                                                <tr key={order.id} className="group hover:bg-slate-50/80 transition-all duration-200">
                                                    <td className="px-6 py-5">
                                                        <span className="text-[13px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                                                            #{order.id.toString().padStart(4, '0')}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex flex-col">
                                                            <span className="text-[14px] font-bold text-slate-900">{order.product_name}</span>
                                                            <span className="text-[11px] text-slate-400 font-medium">Global Fulfillment</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className="text-[14px] font-bold text-slate-700">{order.quantity?.toLocaleString()} Units</span>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <StatusBadge status={order.status} invoice={invoice} />
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        {(() => {
                                                            if (!invoice) return <span className="text-[11px] font-bold text-slate-300 italic uppercase">Awaiting Invoice</span>;
                                                            if (invoice.status === 'pending_approval') {
                                                                return (
                                                                    <button
                                                                        onClick={() => { setSelectedInvoice(invoice); setShowViewInvoice(true); }}
                                                                        className="px-4 py-2 bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all"
                                                                    >
                                                                        Auth Invoice
                                                                    </button>
                                                                );
                                                            }
                                                            return (
                                                                <button
                                                                    onClick={() => { setSelectedInvoice(invoice); setShowViewInvoice(true); }}
                                                                    className={`flex items-center gap-2 text-[13px] font-bold ${invoice.status === 'approved' ? 'text-emerald-600' : 'text-rose-600'
                                                                        }`}
                                                                >
                                                                    {invoice.status === 'approved' ? (
                                                                        <><Check className="w-4 h-4" /> Settlement Finalized</>
                                                                    ) : 'Authorization Rejected'}
                                                                </button>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-2 text-[14px] font-bold text-slate-700">
                                                            <Calendar className="w-4 h-4 text-slate-300" />
                                                            {settingsFormatDate(order.expected_delivery)}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {orders.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-20 text-center">
                                                    <div className="flex flex-col items-center gap-3 opacity-20">
                                                        <Layers className="w-12 h-12" />
                                                        <p className="text-sm font-bold uppercase tracking-widest">No Active Procurements</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>

                    {/* ═══ MODALS (preserved exactly) ════════════════ */}
                    <PlaceOrderModal
                        isOpen={showOrderModal}
                        onClose={() => setShowOrderModal(false)}
                        onSubmit={handlePlaceOrder}
                    />

                    <ViewInvoiceModal
                        isOpen={showViewInvoice}
                        onClose={() => setShowViewInvoice(false)}
                        invoice={selectedInvoice}
                        userRole="buyer"
                        onAction={() => loadDashboardData()}
                    />
                </>
            )}
        </ControlTowerLayout>
    );
}

