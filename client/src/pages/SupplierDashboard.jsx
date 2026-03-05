import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import ControlTowerLayout from '../components/layout/ControlTowerLayout';
import CrisisModal from '../components/CrisisModal';
import {
    Package, Navigation, Bell, Check, X, AlertTriangle,
    Zap, MapPin, Clock, TrendingUp, Calendar, Truck,
    DollarSign, ArrowUpRight, ArrowDownRight, BarChart3,
    Search, Filter, Eye, ChevronLeft, ChevronRight, Activity,
    Globe, Box, Layers, ShoppingCart, Download, Ship, Plane,
    Train, ChevronDown
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from 'recharts';
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
};

// ─── Live Clock ────────────────────────────────────────────────
function LiveClock() {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    return (
        <div className="text-right">
            <div className="text-base font-bold text-slate-900 font-mono leading-tight">
                {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1 justify-end font-medium">
                <Calendar className="w-3 h-3" />
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
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg shadow-slate-200">
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
                        <div key={i} className="w-1 rounded-full opacity-30 bg-slate-400" style={{ height: `${20 + h / 2}%` }} />
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Status Badge (Premium) ────────────────────────────────────
function StatusBadge({ status }) {
    const config = {
        active: 'status-pill-blue',
        processing: 'status-pill-warning',
        pending_invoice: 'status-pill-blue',
        fulfilled: 'status-pill-success',
        delivered: 'status-pill-success',
        in_transit: 'status-pill-blue',
        shipped: 'status-pill-blue',
        at_risk: 'status-pill-danger',
        cancelled: 'bg-slate-50 text-slate-400 border border-slate-100 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider',
    };

    const className = config[status] || 'bg-slate-50 text-slate-400 border border-slate-100 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider';
    const labelMap = { pending_invoice: 'In Transit', completed: 'Delivered', paid: 'Delivered' };
    return (
        <span className={`status-pill ${className}`}>
            {labelMap[status] || status.replace('_', ' ')}
        </span>
    );
}

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
// ─── SUPPLIER DASHBOARD ───────────────────────────────────────
// ═══════════════════════════════════════════════════════════════
export default function SupplierDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { formatCurrency, formatFriendlyDate, refreshIntervalMs } = useSettings();

    // Existing state
    const [incomingOrders, setIncomingOrders] = useState([]);
    const [activeShipments, setActiveShipments] = useState([]);
    const [disruptions, setDisruptions] = useState([]);
    const [showCrisisModal, setShowCrisisModal] = useState(false);
    const [activeCrisis, setActiveCrisis] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingIds, setProcessingIds] = useState(new Set());

    // Table state
    const [allOrders, setAllOrders] = useState([]);
    const [tableSearch, setTableSearch] = useState('');
    const [tableFilter, setTableFilter] = useState('all');
    const [tablePage, setTablePage] = useState(1);
    const [viewOrder, setViewOrder] = useState(null);
    const [expandedRow, setExpandedRow] = useState(null);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const TABLE_PAGE_SIZE = 5;

    // Transport mode icon helper
    const getTransportIcon = (mode) => {
        const m = (mode || '').toLowerCase();
        if (m === 'air') return { icon: Plane, label: 'Air', color: 'text-sky-600', bg: 'bg-sky-50' };
        if (m === 'road') return { icon: Truck, label: 'Road', color: 'text-amber-600', bg: 'bg-amber-50' };
        if (m === 'rail') return { icon: Train, label: 'Rail', color: 'text-violet-600', bg: 'bg-violet-50' };
        return { icon: Ship, label: 'Sea', color: 'text-blue-600', bg: 'bg-blue-50' };
    };

    // Risk score helper
    const getRiskScore = (order) => {
        if (order.status === 'at_risk') return { score: 85, color: 'text-rose-600', bg: 'bg-rose-50', dot: 'bg-rose-500' };
        if (order.status === 'delayed') return { score: 70, color: 'text-orange-600', bg: 'bg-orange-50', dot: 'bg-orange-500' };
        if (order.status === 'processing' || order.status === 'active') return { score: 30, color: 'text-amber-600', bg: 'bg-amber-50', dot: 'bg-amber-500' };
        if (order.status === 'pending_invoice') return { score: 15, color: 'text-blue-600', bg: 'bg-blue-50', dot: 'bg-blue-400' };
        if (order.status === 'completed' || order.status === 'paid' || order.status === 'delivered') return { score: 0, color: 'text-emerald-600', bg: 'bg-emerald-50', dot: 'bg-emerald-500' };
        return { score: 30, color: 'text-slate-600', bg: 'bg-slate-50', dot: 'bg-slate-400' };
    };

    // CSV Export
    const exportCSV = () => {
        const headers = ['Order ID', 'Product', 'Quantity', 'Value', 'Transport', 'Delivery Date', 'Status'];
        const labelMap = { pending_invoice: 'In Transit', completed: 'Delivered', paid: 'Delivered' };
        const rows = filteredOrders.map(o => {
            const t = getTransportIcon(o.transport_mode);
            const statusLabel = labelMap[o.status] || o.status.replace('_', ' ');
            return [o.id, `"${o.product_name}"`, o.quantity, o.total_cost, t.label, o.expected_delivery, statusLabel];
        });
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `shipment_report_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click(); URL.revokeObjectURL(url);
    };

    // ─── AI Pipeline Handler (existing) ────────────────────────
    const handleRunPipeline = async (orderId) => {
        try {
            setIsProcessing(true);
            const response = await api.post('/ai/run-pipeline', { orderId });
            if (response.data.success) {
                setActiveCrisis({
                    disruption: {
                        type: 'Supply Chain Delay',
                        severity: 'high',
                        impact: 'Production halt imminent',
                        affected_orders: [orderId],
                    },
                    plans: [response.data.plans.planA, response.data.plans.planB].filter(Boolean),
                });
                setShowCrisisModal(true);
            }
        } catch (error) {
            console.error('Pipeline failed:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    // ─── Data Fetching ─────────────────────────────────────────
    const fetchSupplierData = useCallback(async () => {
        try {
            const [ordersRes, disruptionsRes, shipmentsRes] = await Promise.all([
                api.get('/orders'),
                api.get('/disruptions/active'),
                api.get('/shipments')
            ]);
            const fetchedOrders = ordersRes.data?.orders || [];
            if (disruptionsRes.data?.disruptions) setDisruptions(disruptionsRes.data.disruptions);
            const fetchedShipments = shipmentsRes.data?.shipments || [];

            // Merge transport_mode from shipments into orders
            const shipmentMap = {};
            fetchedShipments.forEach(s => { if (s.order_id) shipmentMap[s.order_id] = s; });
            const enrichedOrders = fetchedOrders.map(o => ({
                ...o,
                transport_mode: shipmentMap[o.id]?.transport_mode || 'sea',
                shipment_status: shipmentMap[o.id]?.status || null,
            }));
            enrichedOrders.sort((a, b) => b.id - a.id);
            setAllOrders(enrichedOrders);

            const activeOrders = fetchedOrders.filter(o => o.status === 'active' && !processingIds.has(o.id));
            setIncomingOrders(activeOrders.map(order => ({
                id: order.id, product_name: order.product_name, quantity: order.quantity || 0,
                buyer_company: order.buyer_company || 'ACME Manufacturing Corp',
                expected_delivery: order.expected_delivery, status: order.status, total_cost: order.total_cost || 0,
            })));

            setActiveShipments(fetchedShipments.map(s => ({
                ...s,
                progress: s.progress || (s.status === 'delivered' ? 100 : s.status === 'in_transit' ? Math.min(30 + ((s.id * 17) % 50), 85) : s.status === 'shipped' ? Math.min(20 + ((s.id * 13) % 30), 45) : 10)
            })));
        } catch (error) {
            console.error('Failed to fetch supplier data:', error);
        }
    }, [processingIds]);

    useEffect(() => {
        if (user) fetchSupplierData();
        const interval = setInterval(fetchSupplierData, refreshIntervalMs);
        return () => clearInterval(interval);
    }, [fetchSupplierData, user, refreshIntervalMs]);

    // ─── Order Actions ─────────────────────────────────────────
    const handleConfirmOrder = async (orderId) => {
        setProcessingIds(prev => { const next = new Set(prev); next.add(orderId); return next; });
        setIncomingOrders(prev => prev.filter(o => o.id !== orderId));
        try {
            await api.patch(`/orders/${orderId}/status`, { status: 'processing' });
            setTimeout(fetchSupplierData, 500);
        } catch (error) {
            console.error('Failed to accept order:', error);
            setProcessingIds(prev => { const next = new Set(prev); next.delete(orderId); return next; });
            fetchSupplierData();
        }
    };

    const handleDeclineOrder = (orderId) => {
        setIncomingOrders(prev => prev.filter(o => o.id !== orderId));
    };

    // ─── Computed Stats ────────────────────────────────────────
    const stats = useMemo(() => {
        const totalOrders = allOrders.length;
        const fulfilled = allOrders.filter(o => ['fulfilled', 'delivered', 'pending_invoice'].includes(o.status)).length;
        const pending = allOrders.filter(o => o.status === 'active').length;
        const totalRevenue = allOrders.reduce((sum, o) => sum + (o.total_cost || 0), 0);
        const activeShips = activeShipments.filter(s => s.status !== 'delivered').length;
        const deliveredShips = activeShipments.filter(s => s.status === 'delivered').length;
        const atRiskOrders = allOrders.filter(o => o.status === 'at_risk' || o.status === 'delayed').length;
        return { totalOrders, fulfilled, pending, totalRevenue, activeShips, deliveredShips, atRiskOrders };
    }, [allOrders, activeShipments]);

    // ─── Chart Data ────────────────────────────────────────────
    const analyticsData = useMemo(() => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        return months.map((month, i) => ({
            month,
            orders: Math.max(2, stats.totalOrders - i + Math.floor(Math.random() * 3)),
            fulfilled: Math.max(1, Math.floor((stats.totalOrders - i) * 0.75)),
        }));
    }, [stats.totalOrders]);

    const revenueData = useMemo(() => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr'];
        return months.map((month) => ({
            month,
            pct: Math.floor(40 + Math.random() * 50),
        }));
    }, []);

    // ─── Table Filtering ───────────────────────────────────────
    const filteredOrders = useMemo(() => {
        let orders = [...allOrders];
        if (tableFilter !== 'all') orders = orders.filter(o => o.status === tableFilter);
        if (tableSearch) {
            const q = tableSearch.toLowerCase();
            orders = orders.filter(o =>
                o.product_name?.toLowerCase().includes(q) ||
                o.buyer_company?.toLowerCase().includes(q) ||
                String(o.id).includes(q)
            );
        }
        // Date range filter
        if (dateFrom) orders = orders.filter(o => o.expected_delivery >= dateFrom);
        if (dateTo) orders = orders.filter(o => o.expected_delivery <= dateTo);
        return orders;
    }, [allOrders, tableFilter, tableSearch, dateFrom, dateTo]);
    const paginatedOrders = useMemo(() => filteredOrders.slice((tablePage - 1) * TABLE_PAGE_SIZE, tablePage * TABLE_PAGE_SIZE), [filteredOrders, tablePage]);
    const totalPages = Math.ceil(filteredOrders.length / TABLE_PAGE_SIZE);

    // ═══════════════════════════════════════════════════════════
    // ─── RENDER ───────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════
    return (
        <ControlTowerLayout>
            {({ addTerminalLog, setShowTerminal }) => (
                <>
                    {/* Light-themed content wrapper */}
                    <div className="min-h-screen bg-[#F8FAFC] p-8 font-sans text-slate-900">
                        {/* ═══ HEADER ═══════════════════════════════════ */}
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                                    Supplier Dashboard
                                </h1>
                                <p className="text-sm text-slate-500 font-medium mt-1">
                                    Managing supply for <span className="text-slate-900 font-bold">{user?.company_name || 'Global Operations'}</span>
                                </p>
                            </div>
                            <div className="flex items-center gap-4">


                                {/* Alert Bell */}
                                <div className="relative">
                                    <button
                                        onClick={() => navigate('/alerts')}
                                        className={`w-12 h-12 rounded-2xl border transition-all duration-200 flex items-center justify-center group ${stats.atRiskOrders > 0
                                            ? 'bg-rose-50 border-rose-100'
                                            : 'bg-white border-slate-100 hover:border-slate-300'
                                            }`}
                                    >
                                        <Bell className={`w-5 h-5 transition-transform group-hover:rotate-12 ${stats.atRiskOrders > 0 ? 'text-rose-600' : 'text-slate-400'
                                            }`} />
                                    </button>
                                    {stats.atRiskOrders > 0 && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 border-2 border-white rounded-full text-[10px] text-white font-bold flex items-center justify-center animate-bounce">
                                            {stats.atRiskOrders}
                                        </span>
                                    )}
                                </div>

                                <LiveClock />
                            </div>
                        </div>

                        {/* ═══ KPI STATS ROW ════════════════════════════ */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <KPICard
                                title="Total Shipments"
                                value={stats.totalOrders.toLocaleString()}
                                change={12.5}
                                icon={Package}
                                iconColor={T.emerald600}
                                variant="emerald"
                            />
                            <KPICard
                                title="Total Orders"
                                value={allOrders.length.toLocaleString()}
                                change={5.2}
                                icon={ShoppingCart}
                                iconColor={T.blue600}
                                variant="blue"
                            />
                            <KPICard
                                title="Revenue"
                                value={`$${(stats.totalRevenue / 1000).toFixed(0)}K`}
                                change={8.1}
                                icon={DollarSign}
                                iconColor={T.amber600}
                                variant="amber"
                            />
                            <KPICard
                                title="Delivered"
                                value={stats.deliveredShips.toLocaleString()}
                                change={1.3}
                                icon={Truck}
                                iconColor={T.indigo600}
                                variant="indigo"
                            />
                        </div>

                        {/* ═══ MAIN GRID: Analytics + Routes ════════════ */}
                        {/* ═══ MAIN GRID: Analytics + Routes ════════════ */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

                            {/* ─── Shipment Analytics Chart ──────────── */}
                            <Card className="lg:col-span-2">
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center transition-transform group-hover:scale-110">
                                            <BarChart3 className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 tracking-tight transition-colors group-hover:text-blue-600">Shipment Analytics</h3>
                                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-none">Monthly Performance</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 text-[11px] font-bold uppercase tracking-wider">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200" />
                                            <span className="text-slate-500">Orders</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-200" />
                                            <span className="text-slate-500">Fulfilled</span>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardBody>
                                    <div className="h-[280px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={analyticsData} barGap={8}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
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
                                                    contentStyle={{
                                                        background: 'rgba(255, 255, 255, 0.95)',
                                                        backdropFilter: 'blur(8px)',
                                                        border: '1px solid #F1F5F9',
                                                        borderRadius: '16px',
                                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                                        padding: '12px',
                                                    }}
                                                    cursor={{ fill: '#F8FAFC' }}
                                                />
                                                <Bar dataKey="orders" fill="#10B981" radius={[6, 6, 0, 0]} barSize={28} />
                                                <Bar dataKey="fulfilled" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={28} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-8">
                                        <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100/50 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 group/stat">
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 group-hover/stat:text-emerald-600 transition-colors">Fulfillment Rate</p>
                                            <div className="flex items-baseline gap-2">
                                                <p className="text-3xl font-extrabold text-slate-900 leading-none">
                                                    {stats.totalOrders > 0 ? ((stats.fulfilled / stats.totalOrders) * 100).toFixed(1) : 0}%
                                                </p>
                                                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">+2.1%</span>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100/50 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 group/stat">
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 group-hover/stat:text-blue-600 transition-colors">Active Deliveries</p>
                                            <div className="flex items-baseline gap-2">
                                                <p className="text-3xl font-extrabold text-slate-900 leading-none">{stats.activeShips}</p>
                                                <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">LIVE</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>

                            {/* ─── Right Column: Routes + Revenue ────── */}
                            <div className="flex flex-col gap-6">

                                {/* Active Routes */}
                                <Card className="flex-1">
                                    <CardHeader>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                                                <Navigation className="w-4 h-4 text-emerald-600" />
                                            </div>
                                            <h3 className="text-base font-bold text-slate-900 tracking-tight">Active Routes</h3>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg">{activeShipments.length} Active</span>
                                    </CardHeader>
                                    <div className="px-6 py-2 max-h-[320px] overflow-y-auto custom-scrollbar">
                                        {activeShipments.map((shipment) => (
                                            <div key={shipment.id} className="py-4 border-b border-slate-50 last:border-0 group/route">
                                                <div className="flex justify-between items-center mb-3">
                                                    <span className="text-sm font-bold text-slate-800 transition-colors group-hover/route:text-emerald-600">
                                                        {shipment.route || `${shipment.current_location} → Destination`}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 shadow-sm">
                                                        {shipment.transport_mode?.toUpperCase() || 'TRUCK'}
                                                    </span>
                                                </div>
                                                {/* Progress bar */}
                                                <div className="relative h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-3">
                                                    <div
                                                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full transition-all duration-1000"
                                                        style={{ width: `${shipment.progress}%` }}
                                                    />
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium lowercase">
                                                        <MapPin className="w-3 h-3 text-slate-400" />
                                                        {shipment.current_location}
                                                    </div>
                                                    <div className="text-[11px] text-slate-400 font-bold">
                                                        ETA: <span className="text-slate-900">{formatFriendlyDate(shipment.eta || shipment.estimated_arrival)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {activeShipments.length === 0 && (
                                            <div className="text-center py-10">
                                                <Navigation className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                                <p className="text-sm text-slate-400 font-medium">No live shipments tracked</p>
                                            </div>
                                        )}
                                    </div>
                                </Card>

                                {/* Revenue Progress */}
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                                                <DollarSign className="w-4 h-4 text-emerald-600" />
                                            </div>
                                            <h3 className="text-base font-bold text-slate-900 tracking-tight">Revenue Goal</h3>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-sm">
                                            <TrendingUp className="w-4 h-4" />
                                            84%
                                        </div>
                                    </CardHeader>
                                    <CardBody>
                                        <div className="mb-6">
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">MTD REVENUE</p>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{formatCurrency(stats.totalRevenue)}</span>
                                                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">+12%</span>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            {revenueData.map((item) => (
                                                <div key={item.month}>
                                                    <div className="flex justify-between items-center mb-1.5">
                                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{item.month}</span>
                                                        <span className="text-[11px] font-bold text-slate-900">{item.pct}%</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full shadow-lg shadow-emerald-100 transition-all duration-1000"
                                                            style={{ width: `${item.pct}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => navigate('/order-intake')}
                                            className="mt-6 w-full py-2 text-[11px] font-extrabold text-emerald-600 uppercase tracking-widest bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2 group"
                                        >
                                            View Breakdown
                                            <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                        </button>
                                    </CardBody>
                                </Card>
                            </div>
                        </div>

                        {/* ═══ INCOMING ORDERS ══════════════════════════ */}
                        {/* ═══ INCOMING ORDERS ══════════════════════════ */}
                        <Card className="mb-8">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center transition-transform group-hover:scale-110">
                                        <Package className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 tracking-tight transition-colors group-hover:text-blue-600">Incoming Orders</h3>
                                </div>
                                <span className="flex items-center gap-2 px-4 py-1.5 rounded-2xl text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm shadow-emerald-50">
                                    <Activity className="w-3 h-3 animate-pulse" />
                                    {incomingOrders.length} pending
                                </span>
                            </CardHeader>
                            <CardBody>
                                {incomingOrders.length === 0 ? (
                                    <div className="text-center py-16">
                                        <div className="relative w-20 h-20 mx-auto mb-6">
                                            <div className="absolute inset-0 bg-slate-50 rounded-full animate-ping opacity-20" />
                                            <div className="relative w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 shadow-sm">
                                                <Package className="w-10 h-10 text-slate-200" />
                                            </div>
                                        </div>
                                        <h4 className="text-lg font-bold text-slate-900 mb-1">No incoming orders</h4>
                                        <p className="text-sm text-slate-400 font-medium max-w-[280px] mx-auto leading-relaxed">System clear. All received orders have been confirmed or declined.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {incomingOrders.map((order) => (
                                            <div key={order.id} className="relative group/order overflow-hidden p-6 bg-slate-50/50 rounded-2xl border border-slate-100/50 transition-all duration-300 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 hover:border-emerald-200">
                                                {/* Glow Effect */}
                                                <div className="absolute -top-12 -right-12 w-24 h-24 bg-emerald-500/5 blur-3xl rounded-full opacity-0 group-hover/order:opacity-100 transition-opacity" />

                                                <div className="flex justify-between items-start mb-5 relative">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Order ID</span>
                                                            <span className="text-sm font-black text-slate-900 font-mono tracking-tight transition-colors group-hover/order:text-emerald-600">#{order.id.toString().padStart(4, '0')}</span>
                                                        </div>
                                                        <p className="text-[13px] font-bold text-slate-600 flex items-center gap-1.5">
                                                            <ShoppingCart className="w-3.5 h-3.5 text-slate-400" />
                                                            {order.buyer_company}
                                                        </p>
                                                    </div>
                                                    <StatusBadge status="active" />
                                                </div>

                                                <div className="grid grid-cols-2 gap-y-4 gap-x-6 mb-6 relative">
                                                    <div className="group/item">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 group-hover/item:text-emerald-500 transition-colors">Product</p>
                                                        <p className="text-[13px] font-bold text-slate-900 line-clamp-1">{order.product_name}</p>
                                                    </div>
                                                    <div className="group/item">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 group-hover/item:text-emerald-500 transition-colors">Quantity</p>
                                                        <p className="text-[13px] font-black text-slate-900 font-mono leading-none tracking-tight">{order.quantity?.toLocaleString()}</p>
                                                    </div>
                                                    <div className="group/item">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 group-hover/item:text-emerald-500 transition-colors">Total Value</p>
                                                        <p className="text-base font-black text-emerald-600 font-mono leading-none tracking-tight">{formatCurrency(order.total_cost)}</p>
                                                    </div>
                                                    <div className="group/item">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 group-hover/item:text-emerald-500 transition-colors">Deadline</p>
                                                        <div className="flex items-center gap-1.5 text-[13px] font-bold text-slate-900">
                                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                            {formatFriendlyDate(order.expected_delivery)}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-3 relative">
                                                    <button
                                                        onClick={() => handleConfirmOrder(order.id)}
                                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-100 active:scale-95 px-4"
                                                    >
                                                        <Check className="w-3.5 h-3.5" /> Accept
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeclineOrder(order.id)}
                                                        className="flex-1 py-2.5 bg-white text-slate-500 border border-slate-200 rounded-xl text-xs font-bold transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95 px-4"
                                                    >
                                                        Decline
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardBody>
                        </Card>

                        {/* ═══ ORDER REPORT TABLE ═══════════════════════ */}
                        <Card>
                            <CardHeader className="flex-col !items-stretch gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                                            <Layers className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Shipment Report</h3>
                                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-none">Historical Records</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={exportCSV}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 active:scale-95"
                                    >
                                        <Download className="w-4 h-4" /> Export CSV
                                    </button>
                                </div>
                                <div className="flex items-center gap-3 flex-wrap">
                                    {/* Search */}
                                    <div className="relative group/search flex-1 min-w-[200px]">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within/search:text-blue-600" />
                                        <input
                                            type="text"
                                            placeholder="Search orders..."
                                            value={tableSearch}
                                            onChange={(e) => { setTableSearch(e.target.value); setTablePage(1); }}
                                            className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl text-sm font-medium border border-transparent focus:border-blue-200 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                                        />
                                    </div>
                                    {/* Date Range */}
                                    <div className="flex items-center gap-2 bg-slate-50 rounded-xl border border-slate-100 px-3 py-1">
                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                        <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setTablePage(1); }} className="bg-transparent text-xs font-bold text-slate-600 outline-none w-[110px]" />
                                        <span className="text-[10px] text-slate-300 font-black">→</span>
                                        <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setTablePage(1); }} className="bg-transparent text-xs font-bold text-slate-600 outline-none w-[110px]" />
                                        {(dateFrom || dateTo) && <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-slate-400 hover:text-rose-500"><X className="w-3.5 h-3.5" /></button>}
                                    </div>
                                    {/* Filter Pills */}
                                    <div className="flex p-1 bg-slate-50 rounded-xl border border-slate-100">
                                        {[
                                            { key: 'all', label: 'All' },
                                            { key: 'processing', label: 'Processing' },
                                            { key: 'pending_invoice', label: 'Invoiced' },
                                            { key: 'at_risk', label: 'At Risk' },
                                        ].map(f => (
                                            <button
                                                key={f.key}
                                                onClick={() => { setTableFilter(f.key); setTablePage(1); }}
                                                className={`px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all ${tableFilter === f.key
                                                    ? 'bg-white text-blue-600 shadow-sm'
                                                    : 'text-slate-400 hover:text-slate-600'
                                                    }`}
                                            >
                                                {f.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </CardHeader>

                            <div className="overflow-x-auto">
                                <table className="w-full min-w-full border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-50">
                                            {['Order ID', 'Product', 'Qty', 'Value', 'Transport', 'Delivery', 'Status', ''].map((h, i) => (
                                                <th key={h || 'expand'} className={`px-5 py-4 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 text-left`}>
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {paginatedOrders.map((order) => {
                                            const transport = getTransportIcon(order.transport_mode);
                                            const TransportIcon = transport.icon;
                                            const risk = getRiskScore(order);
                                            const isExpanded = expandedRow === order.id;
                                            return (
                                                <>
                                                    <tr key={order.id} className={`group/row transition-all cursor-pointer ${isExpanded ? 'bg-blue-50/40' : 'hover:bg-blue-50/30'}`} onClick={() => setExpandedRow(isExpanded ? null : order.id)}>
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-1.5 h-1.5 rounded-full ${isExpanded ? 'bg-blue-500' : 'bg-slate-200'} group-hover/row:bg-blue-400 transition-colors`} />
                                                                <span className="text-sm font-black text-slate-900 font-mono tracking-tight">#{order.id.toString().padStart(4, '0')}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className="text-[13px] font-bold text-slate-900">{order.product_name}</span>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className="text-sm font-black text-slate-900 font-mono">{order.quantity?.toLocaleString()}</span>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className="text-sm font-black text-emerald-600 font-mono tracking-tight">{formatCurrency(order.total_cost)}</span>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${transport.bg}`}>
                                                                <TransportIcon className={`w-3.5 h-3.5 ${transport.color}`} />
                                                                <span className={`text-[11px] font-bold ${transport.color}`}>{transport.label}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-1.5 text-[13px] font-bold text-slate-600">
                                                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                                {formatFriendlyDate(order.expected_delivery)}
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <StatusBadge status={order.status} />
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform ${isExpanded ? 'rotate-180 text-blue-500' : ''}`} />
                                                        </td>
                                                    </tr>
                                                    {isExpanded && (
                                                        <tr key={`${order.id}-detail`}>
                                                            <td colSpan={8} className="px-0 py-0">
                                                                <div className="bg-slate-50/80 border-t border-b border-blue-100 px-8 py-6">
                                                                    <div className="grid grid-cols-3 gap-6">
                                                                        {/* Supplier Info */}
                                                                        <div className="bg-white rounded-2xl p-5 border border-slate-100">
                                                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Supplier Details</div>
                                                                            <div className="flex items-center gap-3 mb-3">
                                                                                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                                                                                    <Globe className="w-4 h-4 text-blue-600" />
                                                                                </div>
                                                                                <div>
                                                                                    <div className="text-sm font-bold text-slate-900">{order.supplier_name || 'N/A'}</div>
                                                                                    <div className="text-[11px] text-slate-400 font-medium">{order.supplier_location || 'Location not set'}</div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="text-[11px] text-slate-500">Buyer: <span className="font-bold text-slate-700">{order.buyer_company || 'ACME Corp'}</span></div>
                                                                        </div>
                                                                        {/* Transport Details */}
                                                                        <div className="bg-white rounded-2xl p-5 border border-slate-100">
                                                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Transport Details</div>
                                                                            <div className="flex items-center gap-3 mb-3">
                                                                                <div className={`w-9 h-9 rounded-xl ${transport.bg} flex items-center justify-center`}>
                                                                                    <TransportIcon className={`w-4 h-4 ${transport.color}`} />
                                                                                </div>
                                                                                <div>
                                                                                    <div className="text-sm font-bold text-slate-900">{transport.label} Freight</div>
                                                                                    <div className="text-[11px] text-slate-400 font-medium">Mode: {(order.transport_mode || 'sea').toUpperCase()}</div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="text-[11px] text-slate-500">Unit Price: <span className="font-bold text-slate-700 font-mono">{formatCurrency(order.unit_price)}</span></div>
                                                                        </div>
                                                                        {/* Order Timeline */}
                                                                        <div className="bg-white rounded-2xl p-5 border border-slate-100">
                                                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Order Timeline</div>
                                                                            <div className="space-y-3">
                                                                                {[{ label: 'Created', done: true },
                                                                                { label: 'Processing', done: ['processing', 'pending_invoice', 'paid', 'completed', 'at_risk', 'delivered'].includes(order.status) },
                                                                                { label: 'Shipped', done: ['pending_invoice', 'paid', 'completed', 'delivered'].includes(order.status) },
                                                                                { label: 'Delivered', done: ['completed', 'delivered', 'paid'].includes(order.status) }
                                                                                ].map((step, i) => (
                                                                                    <div key={step.label} className="flex items-center gap-3">
                                                                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-black ${step.done ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                                                                                            {step.done ? '✓' : i + 1}
                                                                                        </div>
                                                                                        <span className={`text-xs font-bold ${step.done ? 'text-slate-900' : 'text-slate-400'}`}>{step.label}</span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </>
                                            );
                                        })}
                                        {paginatedOrders.length === 0 && (
                                            <tr>
                                                <td colSpan={8} className="px-6 py-20 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <Search className="w-12 h-12 text-slate-100 mb-4" />
                                                        <h4 className="text-base font-bold text-slate-400">No matching orders found</h4>
                                                        <p className="text-xs text-slate-400 font-medium">Try adjusting your filters or search query</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="px-6 py-4 border-t border-slate-50 flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                        Displaying <span className="text-slate-900">{((tablePage - 1) * TABLE_PAGE_SIZE) + 1}-{Math.min(tablePage * TABLE_PAGE_SIZE, filteredOrders.length)}</span> of <span className="text-slate-900">{filteredOrders.length}</span>
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setTablePage(p => Math.max(1, p - 1))}
                                            disabled={tablePage === 1}
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${tablePage === 1
                                                ? 'border-slate-50 text-slate-200 cursor-not-allowed'
                                                : 'border-slate-100 text-slate-500 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50 active:scale-90'
                                                }`}
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        <div className="flex gap-1.5">
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                                <button
                                                    key={p}
                                                    onClick={() => setTablePage(p)}
                                                    className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${p === tablePage
                                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                                                        : 'text-slate-400 hover:text-slate-800 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => setTablePage(p => Math.min(totalPages, p + 1))}
                                            disabled={tablePage === totalPages}
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${tablePage === totalPages
                                                ? 'border-slate-50 text-slate-200 cursor-not-allowed'
                                                : 'border-slate-100 text-slate-500 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50 active:scale-90'
                                                }`}
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>


                    {/* ═══ CRISIS MODAL ══════════════════════════════ */}
                    {/* ═══ ORDER DETAIL MODAL ═══ */}
                    {viewOrder && (
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewOrder(null)}>
                            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden" onClick={e => e.stopPropagation()}>
                                {/* Modal Header */}
                                <div className={`p-6 border-b ${viewOrder.status === 'at_risk' ? 'bg-gradient-to-r from-rose-50 to-rose-100/50 border-rose-100' : viewOrder.status === 'completed' ? 'bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-emerald-100' : 'bg-gradient-to-r from-slate-50 to-blue-50/50 border-slate-100'}`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Order Details</div>
                                            <h2 className="text-xl font-black text-slate-900 tracking-tight">
                                                #{viewOrder.id?.toString().padStart(4, '0')}
                                            </h2>
                                        </div>
                                        <button onClick={() => setViewOrder(null)} className="w-10 h-10 rounded-xl bg-white/80 border border-slate-200 flex items-center justify-center hover:bg-white transition-colors">
                                            <X className="w-4 h-4 text-slate-500" />
                                        </button>
                                    </div>
                                </div>

                                {/* Modal Body */}
                                <div className="p-6 space-y-5">
                                    {/* Product & Status */}
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Product</div>
                                            <div className="text-base font-bold text-slate-900">{viewOrder.product_name}</div>
                                        </div>
                                        <StatusBadge status={viewOrder.status} />
                                    </div>

                                    {/* Key Details Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50 rounded-2xl p-4">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Quantity</div>
                                            <div className="text-lg font-black text-slate-900 font-mono">{viewOrder.quantity?.toLocaleString()}</div>
                                        </div>
                                        <div className="bg-slate-50 rounded-2xl p-4">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Value</div>
                                            <div className="text-lg font-black text-emerald-600 font-mono">{formatCurrency(viewOrder.total_cost)}</div>
                                        </div>
                                        <div className="bg-slate-50 rounded-2xl p-4">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Unit Price</div>
                                            <div className="text-lg font-black text-slate-700 font-mono">{formatCurrency(viewOrder.unit_price)}</div>
                                        </div>
                                        <div className="bg-slate-50 rounded-2xl p-4">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Expected Delivery</div>
                                            <div className="text-sm font-black text-slate-900">{formatFriendlyDate(viewOrder.expected_delivery)}</div>
                                        </div>
                                    </div>

                                    {/* Supplier Info */}
                                    <div className="bg-blue-50/70 rounded-2xl p-4 border border-blue-100/50">
                                        <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Supplier</div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-white border border-blue-100 flex items-center justify-center">
                                                <Globe className="w-5 h-5 text-blue-500" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-900">{viewOrder.supplier_name || 'N/A'}</div>
                                                <div className="text-xs text-slate-500 flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" /> {viewOrder.supplier_location || 'Location not available'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Risk Alert for at_risk orders */}
                                    {viewOrder.status === 'at_risk' && (
                                        <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100 flex items-start gap-3">
                                            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                                            <div>
                                                <div className="text-sm font-black text-rose-900 mb-1">Order At Risk</div>
                                                <p className="text-xs text-rose-700">This order has been flagged due to supply chain disruptions. Consider running the AI pipeline for recovery options.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Modal Actions */}
                                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center gap-3">
                                    <button
                                        onClick={() => { setViewOrder(null); navigate('/track'); }}
                                        className="flex-1 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Truck className="w-4 h-4" /> Track Shipment
                                    </button>
                                    {viewOrder.status === 'at_risk' && (
                                        <button
                                            onClick={() => { setViewOrder(null); handleRunPipeline(viewOrder.id); }}
                                            className="flex-1 px-4 py-3 rounded-xl bg-rose-500 text-white text-sm font-bold hover:bg-rose-600 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Zap className="w-4 h-4" /> Run AI Recovery
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setViewOrder(null)}
                                        className="px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-white transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {showCrisisModal && activeCrisis && (
                        <CrisisModal
                            disruption={activeCrisis.disruption}
                            plans={activeCrisis.plans}
                            onClose={() => setShowCrisisModal(false)}
                            onAccept={() => { setShowCrisisModal(false); fetchSupplierData(); }}
                            onReject={() => { }}
                        />
                    )}
                </>
            )}
        </ControlTowerLayout>
    );
}


