import { useState, useEffect } from 'react';
import ControlTowerLayout from '../components/layout/ControlTowerLayout';
import { Bell, Check, AlertTriangle, Truck, Package, Clock, X, DollarSign, ShieldAlert, RefreshCw, Filter } from 'lucide-react';
import api from '../utils/api';

// Generate real notifications from orders, shipments, disruptions
function buildNotifications(orders, shipments, disruptions) {
    const notifications = [];
    const now = new Date();

    // 1. Disruption notifications (highest priority)
    disruptions.forEach(d => {
        notifications.push({
            id: `disruption-${d.id}`,
            type: 'disruption',
            title: d.title || `${d.type?.replace('_', ' ')} Alert`,
            message: d.impact_description || d.description || 'A supply chain disruption has been detected.',
            severity: d.severity || 'medium',
            time: d.created_at || d.detected_at || now.toISOString(),
            read: false,
            source: 'disruption',
        });
    });

    // 2. Order notifications
    orders.forEach(o => {
        if (o.status === 'at_risk') {
            notifications.push({
                id: `order-risk-${o.id}`,
                type: 'disruption',
                title: `⚠️ Order #${String(o.id).padStart(4, '0')} At Risk`,
                message: `${o.product_name} from ${o.supplier_name || 'supplier'} is at risk. Quantity: ${o.quantity?.toLocaleString()} units. Review and take action.`,
                time: o.created_at || now.toISOString(),
                read: false,
                source: 'order',
            });
        } else if (o.status === 'paid') {
            notifications.push({
                id: `order-paid-${o.id}`,
                type: 'order',
                title: `✅ Order #${String(o.id).padStart(4, '0')} Payment Confirmed`,
                message: `Payment completed for ${o.product_name}. Amount: $${o.total_cost?.toLocaleString()}.`,
                time: o.created_at || now.toISOString(),
                read: true,
                source: 'order',
            });
        } else if (o.status === 'pending_invoice') {
            notifications.push({
                id: `order-invoice-${o.id}`,
                type: 'alert',
                title: `📋 Invoice Pending for Order #${String(o.id).padStart(4, '0')}`,
                message: `${o.product_name} — awaiting invoice from ${o.supplier_name || 'supplier'}. Total: $${o.total_cost?.toLocaleString()}.`,
                time: o.created_at || now.toISOString(),
                read: false,
                source: 'order',
            });
        } else if (o.status === 'completed') {
            notifications.push({
                id: `order-done-${o.id}`,
                type: 'order',
                title: `✅ Order #${String(o.id).padStart(4, '0')} Completed`,
                message: `${o.product_name} order has been completed successfully. ${o.quantity?.toLocaleString()} units delivered.`,
                time: o.created_at || now.toISOString(),
                read: true,
                source: 'order',
            });
        } else if (o.status === 'active' || o.status === 'confirmed') {
            notifications.push({
                id: `order-active-${o.id}`,
                type: 'order',
                title: `📦 Order #${String(o.id).padStart(4, '0')} Active`,
                message: `${o.product_name} — ${o.quantity?.toLocaleString()} units from ${o.supplier_name || 'supplier'}. Expected delivery: ${o.expected_delivery ? new Date(o.expected_delivery).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'}.`,
                time: o.created_at || now.toISOString(),
                read: true,
                source: 'order',
            });
        }
    });

    // 3. Shipment notifications
    shipments.forEach(s => {
        if (s.status === 'delayed') {
            notifications.push({
                id: `ship-delay-${s.id}`,
                type: 'shipment',
                title: `🚨 Shipment SHP-${String(s.id).padStart(6, '0')} Delayed`,
                message: `${s.product_name || 'Shipment'} is delayed at ${s.current_location || 'transit'}. Route: ${s.route}. Original ETA: ${s.eta ? new Date(s.eta).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}.`,
                time: s.departure_date || now.toISOString(),
                read: false,
                source: 'shipment',
            });
        } else if (s.status === 'in_transit') {
            notifications.push({
                id: `ship-transit-${s.id}`,
                type: 'shipment',
                title: `🚛 Shipment SHP-${String(s.id).padStart(6, '0')} In Transit`,
                message: `${s.product_name || 'Shipment'} is currently at ${s.current_location || 'in transit'}. Route: ${s.route}. ETA: ${s.eta ? new Date(s.eta).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}.`,
                time: s.departure_date || now.toISOString(),
                read: true,
                source: 'shipment',
            });
        } else if (s.status === 'delivered') {
            notifications.push({
                id: `ship-delivered-${s.id}`,
                type: 'shipment',
                title: `✅ Shipment SHP-${String(s.id).padStart(6, '0')} Delivered`,
                message: `${s.product_name || 'Shipment'} has been delivered to ${s.current_location || 'destination'}. Route: ${s.route}.`,
                time: s.eta || now.toISOString(),
                read: true,
                source: 'shipment',
            });
        }
    });

    // Sort: unread first, then by time (newest first)
    notifications.sort((a, b) => {
        if (a.read !== b.read) return a.read ? 1 : -1;
        return new Date(b.time) - new Date(a.time);
    });

    return notifications;
}

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, unread, disruption, order, shipment
    const [dismissedIds, setDismissedIds] = useState(() => {
        try { return JSON.parse(localStorage.getItem('dismissed_notifications') || '[]'); } catch { return []; }
    });
    const [readIds, setReadIds] = useState(() => {
        try { return JSON.parse(localStorage.getItem('read_notifications') || '[]'); } catch { return []; }
    });

    useEffect(() => {
        loadNotifications();
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadNotifications = async () => {
        try {
            const [ordersRes, shipmentsRes, disruptionsRes] = await Promise.all([
                api.get('/orders').catch(() => ({ data: { orders: [] } })),
                api.get('/shipments').catch(() => ({ data: { shipments: [] } })),
                api.get('/disruptions/active').catch(() => ({ data: { disruptions: [] } })),
            ]);

            const orders = ordersRes.data?.orders || ordersRes.data || [];
            const shipments = shipmentsRes.data?.shipments || shipmentsRes.data || [];
            const disruptions = disruptionsRes.data?.disruptions || disruptionsRes.data || [];

            const built = buildNotifications(
                Array.isArray(orders) ? orders : [],
                Array.isArray(shipments) ? shipments : [],
                Array.isArray(disruptions) ? disruptions : []
            );

            // Apply persisted read/dismissed state
            const final = built
                .filter(n => !dismissedIds.includes(n.id))
                .map(n => ({
                    ...n,
                    read: n.read || readIds.includes(n.id),
                }));

            setNotifications(final);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAllRead = () => {
        const allIds = notifications.map(n => n.id);
        const newReadIds = [...new Set([...readIds, ...allIds])];
        setReadIds(newReadIds);
        localStorage.setItem('read_notifications', JSON.stringify(newReadIds));
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const markRead = (id) => {
        const newReadIds = [...new Set([...readIds, id])];
        setReadIds(newReadIds);
        localStorage.setItem('read_notifications', JSON.stringify(newReadIds));
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const dismiss = (id) => {
        const newDismissed = [...new Set([...dismissedIds, id])];
        setDismissedIds(newDismissed);
        localStorage.setItem('dismissed_notifications', JSON.stringify(newDismissed));
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const clearDismissed = () => {
        setDismissedIds([]);
        localStorage.removeItem('dismissed_notifications');
        loadNotifications();
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'disruption': return <AlertTriangle className="w-5 h-5 text-rose-500" />;
            case 'order': return <Package className="w-5 h-5 text-blue-500" />;
            case 'shipment': return <Truck className="w-5 h-5 text-emerald-500" />;
            case 'alert': return <DollarSign className="w-5 h-5 text-amber-500" />;
            default: return <Bell className="w-5 h-5 text-slate-400" />;
        }
    };

    const getTypeBorderColor = (type, read) => {
        if (read) return 'border-slate-100';
        switch (type) {
            case 'disruption': return 'border-rose-200 shadow-rose-50';
            case 'order': return 'border-blue-200 shadow-blue-50';
            case 'shipment': return 'border-emerald-200 shadow-emerald-50';
            case 'alert': return 'border-amber-200 shadow-amber-50';
            default: return 'border-slate-200';
        }
    };

    const filtered = filter === 'all'
        ? notifications
        : filter === 'unread'
            ? notifications.filter(n => !n.read)
            : notifications.filter(n => n.type === filter);

    const unreadCount = notifications.filter(n => !n.read).length;

    const filterButtons = [
        { key: 'all', label: 'All', count: notifications.length },
        { key: 'unread', label: 'Unread', count: unreadCount },
        { key: 'disruption', label: 'Disruptions', count: notifications.filter(n => n.type === 'disruption').length },
        { key: 'order', label: 'Orders', count: notifications.filter(n => n.type === 'order').length },
        { key: 'shipment', label: 'Shipments', count: notifications.filter(n => n.type === 'shipment').length },
    ];

    return (
        <ControlTowerLayout>
            {() => (
                <div className="max-w-3xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center relative">
                                    <Bell className="w-6 h-6 text-blue-600" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-sm shadow-rose-200">
                                            {unreadCount}
                                        </span>
                                    )}
                                </div>
                                Notifications
                            </h1>
                            <p className="text-sm text-slate-500 mt-1 ml-[60px]">
                                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'} · {notifications.length} total
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={loadNotifications} className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors" title="Refresh">
                                <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                            {unreadCount > 0 && (
                                <button onClick={markAllRead} className="px-4 py-2.5 rounded-xl text-sm font-bold text-blue-600 hover:bg-blue-50 transition-colors border border-blue-200 flex items-center gap-2">
                                    <Check className="w-4 h-4" /> Mark all read
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {filterButtons.map(f => (
                            <button
                                key={f.key}
                                onClick={() => setFilter(f.key)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${filter === f.key
                                    ? 'bg-slate-900 text-white shadow-sm'
                                    : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
                                    }`}
                            >
                                {f.label}
                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${filter === f.key ? 'bg-white/20' : 'bg-slate-100'}`}>
                                    {f.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Loading */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center">
                            <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4">
                                <Bell className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 mb-1">
                                {filter === 'unread' ? 'All caught up!' : 'No notifications'}
                            </h3>
                            <p className="text-sm text-slate-500">
                                {filter === 'unread'
                                    ? 'You have read all your notifications.'
                                    : `No ${filter === 'all' ? '' : filter} notifications to display.`}
                            </p>
                            {dismissedIds.length > 0 && (
                                <button onClick={clearDismissed} className="mt-4 text-sm font-bold text-blue-600 hover:underline">
                                    Restore {dismissedIds.length} dismissed notifications
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filtered.map((n) => (
                                <div
                                    key={n.id}
                                    onClick={() => !n.read && markRead(n.id)}
                                    className={`bg-white rounded-2xl border p-5 transition-all group cursor-pointer hover:shadow-md ${!n.read ? `shadow-sm ${getTypeBorderColor(n.type, false)}` : `${getTypeBorderColor(n.type, true)} opacity-75 hover:opacity-100`}`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${!n.read
                                            ? n.type === 'disruption' ? 'bg-rose-50' : n.type === 'shipment' ? 'bg-emerald-50' : n.type === 'alert' ? 'bg-amber-50' : 'bg-blue-50'
                                            : 'bg-slate-50'
                                            }`}>
                                            {getTypeIcon(n.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <div className="flex items-center gap-2">
                                                    {!n.read && <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
                                                    <h3 className={`text-[14px] font-bold leading-snug ${n.read ? 'text-slate-600' : 'text-slate-900'}`}>{n.title}</h3>
                                                </div>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 whitespace-nowrap">
                                                        <Clock className="w-3 h-3" /> {timeAgo(n.time)}
                                                    </span>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 rounded-lg"
                                                        title="Dismiss"
                                                    >
                                                        <X className="w-3.5 h-3.5 text-slate-400" />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-[13px] text-slate-500 leading-relaxed">{n.message}</p>

                                            {/* Source badge */}
                                            <div className="mt-2.5 flex items-center gap-2">
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${n.type === 'disruption' ? 'bg-rose-50 text-rose-600'
                                                    : n.type === 'shipment' ? 'bg-emerald-50 text-emerald-600'
                                                        : n.type === 'alert' ? 'bg-amber-50 text-amber-600'
                                                            : 'bg-blue-50 text-blue-600'
                                                    }`}>
                                                    {n.type}
                                                </span>
                                                {n.severity && n.type === 'disruption' && (
                                                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-rose-500 text-white">
                                                        {n.severity}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Restore dismissed */}
                    {dismissedIds.length > 0 && filtered.length > 0 && (
                        <div className="text-center py-4">
                            <button onClick={clearDismissed} className="text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors">
                                Restore {dismissedIds.length} dismissed notification{dismissedIds.length > 1 ? 's' : ''}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </ControlTowerLayout>
    );
}
