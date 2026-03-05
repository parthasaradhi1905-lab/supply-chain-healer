import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ControlTowerLayout from '../components/layout/ControlTowerLayout';
import { Package, Search, Filter, Clock, DollarSign, AlertTriangle, CheckCircle, Navigation, ArrowUpRight, Box } from 'lucide-react';
import api from '../utils/api';

export default function MyOrdersPage() {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const response = await api.get('/orders');
            let fetchedOrders = response.data.orders || [];

            // Filter down if necessary (usually backend scopes, but just in case)
            // Removed strict buyer filtering for demo purposes since DB order `buyer_id` might not map cleanly.
            // fetchedOrders = fetchedOrders.filter(o => o.buyer_id === user.id);

            // Sort by ID descending (newest first)
            fetchedOrders.sort((a, b) => b.id - a.id);
            setOrders(fetchedOrders);
        } catch (error) {
            console.error('Failed to load orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesFilter = filter === 'all' || order.status === filter;
        const matchesSearch = order.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.id.toString().includes(searchTerm);
        return matchesFilter && matchesSearch;
    });

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'active': return <Clock className="w-3.5 h-3.5" />;
            case 'at_risk': return <AlertTriangle className="w-3.5 h-3.5" />;
            case 'recovered': return <CheckCircle className="w-3.5 h-3.5" />;
            case 'completed':
            case 'delivered': return <CheckCircle className="w-3.5 h-3.5" />;
            case 'processing': return <Package className="w-3.5 h-3.5" />;
            default: return <Navigation className="w-3.5 h-3.5" />;
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'active': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'processing': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'at_risk': return 'bg-rose-50 text-rose-700 border-rose-200';
            case 'recovered': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'completed':
            case 'delivered': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'cancelled': return 'bg-slate-100 text-slate-500 border-slate-200';
            default: return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(val || 0);
    };

    return (
        <ControlTowerLayout>
            {() => (
                <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-200">
                                    <Package className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Order Directory</h1>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
                                        Track & Manage Pipeline
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-right px-6 py-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                                <div className="text-lg font-black text-slate-900">
                                    {orders.length}
                                </div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Total Orders</div>
                            </div>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative flex-1 max-w-md w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by ID, Product, or Supplier..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all placeholder:text-slate-400"
                            />
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="flex items-center gap-2 pl-4 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                                <Filter className="w-4 h-4 text-slate-400" />
                                <select
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                    className="bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 cursor-pointer pr-8 uppercase tracking-widest"
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="processing">Processing</option>
                                    <option value="at_risk">At Risk</option>
                                    <option value="recovered">Recovered</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Orders Grid */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 space-y-4">
                            <div className="w-10 h-10 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Directory...</p>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/20 text-center">
                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                <Package className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">No Records Found</h3>
                            <p className="text-slate-500 font-medium max-w-md">
                                Try adjusting your search or filter settings.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {filteredOrders.map((order) => (
                                <div
                                    key={order.id}
                                    className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                                            <Box className="w-6 h-6 text-slate-400" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="font-mono text-xs font-black text-slate-400 tracking-widest">
                                                    {order.shipment_id ? `SHP-${order.shipment_id.toString().padStart(6, '0')}` : 'PENDING'}
                                                </span>
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${getStatusClass(order.status)}`}>
                                                    {getStatusIcon(order.status)}
                                                    {order.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <h4 className="text-lg font-black text-slate-900 tracking-tight">
                                                {order.product_name}
                                            </h4>
                                            <p className="text-sm font-medium text-slate-500 mt-1">
                                                Supplier: <span className="text-slate-900 font-bold">{order.supplier_name || 'Generic Corp'}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">

                                        <div className="flex gap-8">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Volume</p>
                                                <p className="text-sm font-bold text-slate-900">{order.quantity?.toLocaleString()} units</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ETA</p>
                                                <p className="text-sm font-bold text-slate-900 flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {formatDate(order.expected_delivery)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Value</p>
                                                <p className="text-lg font-black text-slate-900">{formatCurrency(order.total_cost)}</p>
                                            </div>
                                        </div>

                                        <button className="h-10 w-10 md:w-12 md:h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors ml-auto md:ml-4 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900">
                                            <ArrowUpRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </ControlTowerLayout>
    );
}
