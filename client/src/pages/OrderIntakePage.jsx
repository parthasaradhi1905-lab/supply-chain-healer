import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import ControlTowerLayout from '../components/layout/ControlTowerLayout';
import CreateInvoiceModal from '../components/invoices/CreateInvoiceModal';
import ViewInvoiceModal from '../components/invoices/ViewInvoiceModal';
import {
    Package, Clock, Check, X, Search, CheckCircle,
    FileText, Filter, Calendar, DollarSign, ArrowRight,
    ArrowUpRight, ShoppingCart, Activity, AlertCircle,
    ChevronRight, CreditCard, Zap, Eye
} from 'lucide-react';
import api from '../utils/api';

/**
 * Order Intake Page - Premium Light Redesign
 * Handles order confirmation and invoicing workflow
 */
export default function OrderIntakePage() {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingIds, setProcessingIds] = useState(new Set());
    const [filter, setFilter] = useState('all');

    // Invoice state
    const [invoices, setInvoices] = useState([]);
    const [showCreateInvoice, setShowCreateInvoice] = useState(false);
    const [showViewInvoice, setShowViewInvoice] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [user]);

    const fetchData = async () => {
        try {
            const ordersRes = await api.get('/orders');
            const allOrders = ordersRes.data?.orders || [];
            allOrders.sort((a, b) => b.id - a.id);

            const invoicePromises = allOrders
                .filter(o => o.status !== 'active')
                .map(o => api.get(`/invoices/order/${o.id}`).catch(() => ({ data: { success: false } })));

            const invoiceResults = await Promise.all(invoicePromises);
            const fetchedInvoices = invoiceResults
                .filter(r => r.data?.success && r.data?.invoice)
                .map(r => r.data.invoice);

            setOrders(allOrders.map(order => ({
                ...order,
                buyer_company: order.buyer_company || 'ACME Manufacturing Corp',
            })));
            setInvoices(fetchedInvoices);
            setLoading(false);
        } catch (error) {
            console.error('Failed to load data:', error);
            setLoading(false);
        }
    };

    const handleConfirmOrder = async (orderId) => {
        setProcessingIds(prev => {
            const next = new Set(prev);
            next.add(orderId);
            return next;
        });

        try {
            await api.patch(`/orders/${orderId}/status`, { status: 'pending_invoice' });
            setTimeout(fetchData, 500);
        } catch (error) {
            console.error('Failed to accept order:', error);
            setProcessingIds(prev => {
                const next = new Set(prev);
                next.delete(orderId);
                return next;
            });
            fetchData();
        }
    };

    const getInvoiceForOrder = (orderId) => invoices.find(i => i.order_id === orderId);

    const getOrderStatus = (order) => {
        const invoice = getInvoiceForOrder(order.id);
        if (invoice) {
            if (invoice.status === 'approved') return { label: 'Settled', variant: 'success', icon: CheckCircle };
            if (invoice.status === 'pending_approval') return { label: 'Invoiced', variant: 'warning', icon: Clock };
            if (invoice.status === 'rejected') return { label: 'Disputed', variant: 'error', icon: AlertCircle };
        }
        if (order.status === 'pending_invoice') return { label: 'Action Required', variant: 'error', icon: AlertCircle };
        if (order.status === 'active') return { label: 'New Order', variant: 'blue', icon: Zap };
        if (order.status === 'processing') return { label: 'Fulfilling', variant: 'blue', icon: Activity };
        return { label: order.status, variant: 'slate', icon: Package };
    };

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            if (filter === 'all') return true;
            if (filter === 'active') return order.status === 'active';
            if (filter === 'pending_invoice') return order.status === 'pending_invoice' && !getInvoiceForOrder(order.id);
            if (filter === 'invoiced') return !!getInvoiceForOrder(order.id);
            return true;
        });
    }, [orders, filter, invoices]);

    const counts = useMemo(() => ({
        all: orders.length,
        active: orders.filter(o => o.status === 'active').length,
        pending_invoice: orders.filter(o => o.status === 'pending_invoice' && !getInvoiceForOrder(o.id)).length,
        invoiced: orders.filter(o => !!getInvoiceForOrder(o.id)).length,
    }), [orders, invoices]);

    return (
        <ControlTowerLayout>
            {() => (
                <div className="min-h-screen bg-[#F8FAFC] p-8 font-sans text-slate-900">
                    {/* ═══ HEADER ═══════════════════════════════════ */}
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                                    <ShoppingCart className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Supply Management</span>
                            </div>
                            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                                Order Intake
                            </h1>
                            <p className="text-sm text-slate-500 font-medium mt-1">
                                Review, acknowledge, and manage financial clearance for incoming demand
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            {counts.pending_invoice > 0 && (
                                <div className="flex items-center gap-3 px-5 py-3 bg-rose-50 border border-rose-100 rounded-2xl animate-pulse shadow-sm shadow-rose-100">
                                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                                    <span className="text-xs font-black text-rose-600 uppercase tracking-widest">
                                        {counts.pending_invoice} Action Items
                                    </span>
                                </div>
                            )}
                            <div className="premium-card px-6 py-3 flex items-center gap-3 bg-white/80 backdrop-blur-md">
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Total Volume</p>
                                    <p className="text-lg font-black text-slate-900 leading-none">{orders.length}</p>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-200">
                                    <Package className="w-5 h-5 text-white" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ═══ FILTER TABS ══════════════════════════════ */}
                    <div className="flex gap-3 mb-8 p-1.5 bg-slate-100/50 backdrop-blur-md rounded-2xl w-fit border border-slate-200/50 shadow-inner">
                        {[
                            { key: 'all', label: 'All Stream', icon: Activity },
                            { key: 'active', label: 'Pending Action', icon: Zap },
                            { key: 'pending_invoice', label: 'Clearance Required', icon: CreditCard },
                            { key: 'invoiced', label: 'Completed Flow', icon: CheckCircle },
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setFilter(tab.key)}
                                className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${filter === tab.key
                                    ? 'bg-white text-slate-900 shadow-xl shadow-slate-200/50 scale-[1.02] border border-white'
                                    : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                                    }`}
                            >
                                <tab.icon className={`w-4 h-4 ${filter === tab.key ? 'text-blue-600' : 'text-slate-300'}`} />
                                {tab.label}
                                <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] ${filter === tab.key ? 'bg-blue-50 text-blue-600' : 'bg-slate-200/50 text-slate-400'}`}>
                                    {counts[tab.key]}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* ═══ ORDERS LIST ══════════════════════════════ */}
                    <div className="space-y-6">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white/50 rounded-[32px] border border-slate-100 border-dashed">
                                <Activity className="w-12 h-12 text-blue-200 animate-spin-slow mb-4" />
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Synchronizing Demand...</p>
                            </div>
                        ) : filteredOrders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 bg-white/50 rounded-[32px] border border-slate-100 border-dashed">
                                <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
                                    <CheckCircle className="w-10 h-10 text-slate-200" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">Queue Clear</h3>
                                <p className="text-slate-400 font-medium">No orders found matching your current filter.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {filteredOrders.map((order) => {
                                    const invoice = getInvoiceForOrder(order.id);
                                    const status = getOrderStatus(order);
                                    const isCritical = !invoice && order.status === 'pending_invoice';

                                    return (
                                        <div
                                            key={order.id}
                                            className={`premium-card p-6 transition-all duration-300 cursor-pointer group hover:-translate-y-1 ${isCritical ? 'border-rose-100 shadow-lg shadow-rose-500/5' : ''}`}
                                        >
                                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                                                {/* Left: Info */}
                                                <div className="flex items-start gap-6">
                                                    <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center shrink-0 shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-3 ${isCritical
                                                        ? 'bg-rose-50 text-rose-600 shadow-rose-100'
                                                        : invoice?.status === 'approved'
                                                            ? 'bg-emerald-50 text-emerald-600 shadow-emerald-100'
                                                            : 'bg-blue-50 text-blue-600 shadow-blue-100'
                                                        }`}>
                                                        {invoice ? (
                                                            <FileText className="w-8 h-8" />
                                                        ) : (
                                                            <Package className="w-8 h-8" />
                                                        )}
                                                    </div>

                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-3">
                                                            <h4 className="text-xl font-black text-slate-900 tracking-tight">
                                                                Order #{order.id}
                                                            </h4>
                                                            <span className={`status-pill status-pill-${status.variant}`}>
                                                                <status.icon className="w-3 h-3 mr-1.5" />
                                                                {status.label}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm font-bold text-slate-500 flex items-center gap-2">
                                                            <span className="text-slate-900">{order.product_name}</span>
                                                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                            <span className="font-mono text-xs opacity-80">{order.quantity?.toLocaleString() || 0} Units</span>
                                                        </p>
                                                        <div className="flex flex-wrap items-center gap-4 mt-2">
                                                            <div className="flex items-center gap-1.5 py-1 px-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px] font-bold text-slate-400">
                                                                <Calendar className="w-3.5 h-3.5" />
                                                                Due {new Date(order.expected_delivery).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 py-1 px-3 bg-emerald-50 rounded-lg border border-emerald-100 text-[11px] font-black text-emerald-600">
                                                                <DollarSign className="w-3.5 h-3.5" />
                                                                ${order.total_cost?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                            </div>
                                                            {invoice && (
                                                                <div className="flex items-center gap-1.5 py-1 px-3 bg-blue-50 rounded-lg border border-blue-100 text-[11px] font-bold text-blue-600">
                                                                    <FileText className="w-3.5 h-3.5" />
                                                                    INV #{invoice.invoice_number}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right: Actions */}
                                                <div className="flex items-center gap-3 shrink-0 lg:pl-10 lg:border-l border-slate-100">
                                                    {/* New order — Accept/Decline */}
                                                    {order.status === 'active' && !invoice && (
                                                        <>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleConfirmOrder(order.id); }}
                                                                disabled={processingIds.has(order.id)}
                                                                className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-200 transition-all hover:bg-emerald-700 hover:-translate-y-1 active:scale-95 flex items-center gap-2"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                                {processingIds.has(order.id) ? 'Processing...' : 'Acknowledge'}
                                                            </button>
                                                            <button className="px-6 py-3 bg-white text-slate-400 border border-slate-200 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all hover:text-slate-900 hover:border-slate-300 active:scale-95 flex items-center gap-2">
                                                                <X className="w-4 h-4" />
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}

                                                    {/* Pending invoice — Create Invoice */}
                                                    {order.status === 'pending_invoice' && !invoice && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedOrder(order);
                                                                setShowCreateInvoice(true);
                                                            }}
                                                            className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/20 transition-all hover:bg-slate-800 hover:-translate-y-1 active:scale-95 flex items-center gap-2 animate-bounce-slow"
                                                        >
                                                            <CreditCard className="w-4 h-4" />
                                                            Submit Clearance
                                                        </button>
                                                    )}

                                                    {/* Has invoice — View Invoice */}
                                                    {invoice && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedInvoice(invoice);
                                                                setShowViewInvoice(true);
                                                            }}
                                                            className="px-8 py-3 bg-white text-blue-600 border border-blue-200 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:bg-blue-50 hover:border-blue-300 active:scale-95 flex items-center gap-2"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                            Review Documents
                                                        </button>
                                                    )}

                                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 group-hover:text-blue-500 transition-colors">
                                                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* ═══ MODALS ═══════════════════════════════════ */}
                    <CreateInvoiceModal
                        isOpen={showCreateInvoice}
                        onClose={() => setShowCreateInvoice(false)}
                        order={selectedOrder}
                        onCreate={() => {
                            setShowCreateInvoice(false);
                            fetchData();
                        }}
                    />

                    <ViewInvoiceModal
                        isOpen={showViewInvoice}
                        onClose={() => setShowViewInvoice(false)}
                        invoice={selectedInvoice}
                        userRole="supplier"
                        onAction={() => fetchData()}
                    />
                </div>
            )}
        </ControlTowerLayout>
    );
}
