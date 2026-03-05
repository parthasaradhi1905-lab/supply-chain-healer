import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Package, Navigation, AlertTriangle, Building2, User, FileText, ArrowRight } from 'lucide-react';
import api from '../../utils/api';

export default function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState({ orders: [], suppliers: [], routes: [] });
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    // Toggle logic (CMD+K or CTRL+K)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen((open) => !open);
            }
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // Handle search
    useEffect(() => {
        if (!isOpen) {
            setQuery('');
            setResults({ orders: [], suppliers: [], routes: [] });
            setSelectedIndex(0);
            return;
        }

        // Focus input when opened
        setTimeout(() => inputRef.current?.focus(), 50);

        const fetchResults = async () => {
            if (!query.trim()) {
                setResults({ orders: [], suppliers: [], routes: [] });
                return;
            }

            setLoading(true);
            try {
                // In a real app, this would be a dedicated multi-search endpoint
                // For now, we'll fetch basic data and filter client-side for the demo
                const [ordersRes, suppliersRes] = await Promise.all([
                    api.get('/orders').catch(() => ({ data: { orders: [] } })),
                    api.get('/suppliers').catch(() => ({ data: { suppliers: [] } }))
                ]);

                const allOrders = ordersRes.data.orders || [];
                const allSuppliers = suppliersRes.data.suppliers || [];

                const q = query.toLowerCase();

                const filteredOrders = allOrders.filter(o =>
                    o.id.toString().includes(q) ||
                    o.product_name?.toLowerCase().includes(q) ||
                    o.status?.toLowerCase().includes(q)
                ).slice(0, 4);

                const filteredSuppliers = allSuppliers.filter(s =>
                    s.name?.toLowerCase().includes(q) ||
                    s.location?.toLowerCase().includes(q)
                ).slice(0, 3);

                // Mock routes/pages search
                const pages = [
                    { title: 'Buyer Dashboard', path: '/buyer-dashboard', icon: 'dashboard' },
                    { title: 'Supplier Dashboard', path: '/supplier-dashboard', icon: 'dashboard' },
                    { title: 'Order Intakes', path: '/intakes', icon: 'orders' },
                    { title: 'My Orders', path: '/orders', icon: 'orders' },
                    { title: 'Track Shipments', path: '/track', icon: 'track' },
                    { title: 'Alert Center', path: '/alerts', icon: 'alert' }
                ];
                const filteredRoutes = pages.filter(p => p.title.toLowerCase().includes(q)).slice(0, 3);

                setResults({
                    orders: filteredOrders,
                    suppliers: filteredSuppliers,
                    routes: filteredRoutes
                });
                setSelectedIndex(0);

            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(fetchResults, 250);
        return () => clearTimeout(debounce);
    }, [query, isOpen]);

    // Calculate total flat items for keyboard navigation
    const allItems = [
        ...results.routes.map(item => ({ ...item, type: 'route' })),
        ...results.orders.map(item => ({ ...item, type: 'order' })),
        ...results.suppliers.map(item => ({ ...item, type: 'supplier' }))
    ];

    // Keyboard navigation within results
    useEffect(() => {
        if (!isOpen) return;

        const handleNavigation = (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev < allItems.length - 1 ? prev + 1 : prev));
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
            }
            if (e.key === 'Enter' && allItems[selectedIndex]) {
                e.preventDefault();
                handleSelect(allItems[selectedIndex]);
            }
        };

        window.addEventListener('keydown', handleNavigation);
        return () => window.removeEventListener('keydown', handleNavigation);
    }, [isOpen, allItems, selectedIndex]);

    const handleSelect = (item) => {
        setIsOpen(false);
        if (item.type === 'route') {
            navigate(item.path);
        } else if (item.type === 'order') {
            navigate('/orders'); // Or a specific order page if available
        } else if (item.type === 'supplier') {
            // Navigate to supplier profile if built
            console.log('Navigate to supplier:', item.id);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={() => setIsOpen(false)}
            />

            {/* Command Palette Modal */}
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Search Input */}
                <div className="flex items-center px-4 py-4 border-b border-slate-100">
                    <Search className="w-5 h-5 text-slate-400 shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search orders, suppliers, shipments, or pages..."
                        className="flex-1 px-4 py-2 bg-transparent text-slate-900 text-lg placeholder:text-slate-400 focus:outline-none"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-[10px] font-mono font-bold text-slate-500 uppercase">
                        ESC
                    </kbd>
                </div>

                {/* Results Area */}
                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
                        </div>
                    ) : query && allItems.length === 0 ? (
                        <div className="px-6 py-12 text-center text-slate-500">
                            No results found for "{query}"
                        </div>
                    ) : !query ? (
                        <div className="px-6 py-8 text-center text-slate-400 text-sm">
                            <p>Type to search the Aegis Nexus network...</p>
                            <div className="flex items-center justify-center gap-4 mt-4">
                                <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-mono">↑↓</kbd> to navigate</span>
                                <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-mono">↵</kbd> to select</span>
                            </div>
                        </div>
                    ) : (
                        <div className="py-2">
                            {/* Pages / Routes */}
                            {results.routes.length > 0 && (
                                <div className="mb-4">
                                    <div className="px-4 py-1 text-xs font-bold text-slate-400 uppercase tracking-widest">Navigation</div>
                                    <ul className="mt-1">
                                        {results.routes.map((route) => {
                                            const globalIndex = allItems.findIndex(i => i.title === route.title && i.type === 'route');
                                            const isSelected = selectedIndex === globalIndex;
                                            return (
                                                <li
                                                    key={route.path}
                                                    onClick={() => handleSelect({ ...route, type: 'route' })}
                                                    className={`px-4 py-3 mx-2 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${isSelected ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-50 text-slate-600'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Navigation className="w-4 h-4 text-slate-400" />
                                                        <span className="font-medium">{route.title}</span>
                                                    </div>
                                                    {isSelected && <ArrowRight className="w-4 h-4 text-slate-400" />}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            )}

                            {/* Orders */}
                            {results.orders.length > 0 && (
                                <div className="mb-4">
                                    <div className="px-4 py-1 text-xs font-bold text-slate-400 uppercase tracking-widest">Orders</div>
                                    <ul className="mt-1">
                                        {results.orders.map((order) => {
                                            const globalIndex = allItems.findIndex(i => i.id === order.id && i.type === 'order');
                                            const isSelected = selectedIndex === globalIndex;
                                            return (
                                                <li
                                                    key={order.id}
                                                    onClick={() => handleSelect({ ...order, type: 'order' })}
                                                    className={`px-4 py-3 mx-2 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${isSelected ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-50 text-slate-600'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Package className="w-4 h-4 text-slate-400" />
                                                        <div>
                                                            <div className="font-medium">Order #{order.id.toString().padStart(4, '0')} - {order.product_name}</div>
                                                            <div className="text-xs text-slate-400 mt-0.5">{order.supplier_name || 'Generic Corp'} • {order.status}</div>
                                                        </div>
                                                    </div>
                                                    {isSelected && <ArrowRight className="w-4 h-4 text-slate-400" />}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            )}

                            {/* Suppliers */}
                            {results.suppliers.length > 0 && (
                                <div className="mb-2">
                                    <div className="px-4 py-1 text-xs font-bold text-slate-400 uppercase tracking-widest">Suppliers</div>
                                    <ul className="mt-1">
                                        {results.suppliers.map((supplier) => {
                                            const globalIndex = allItems.findIndex(i => i.id === supplier.id && i.type === 'supplier');
                                            const isSelected = selectedIndex === globalIndex;
                                            return (
                                                <li
                                                    key={supplier.id}
                                                    onClick={() => handleSelect({ ...supplier, type: 'supplier' })}
                                                    className={`px-4 py-3 mx-2 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${isSelected ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-50 text-slate-600'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Building2 className="w-4 h-4 text-slate-400" />
                                                        <div>
                                                            <div className="font-medium">{supplier.name}</div>
                                                            <div className="text-xs text-slate-400 mt-0.5">{supplier.location} • Tier {supplier.tier}</div>
                                                        </div>
                                                    </div>
                                                    {isSelected && <ArrowRight className="w-4 h-4 text-slate-400" />}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
