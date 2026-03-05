import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import {
    LayoutDashboard,
    Package,
    Truck,
    Bell,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Shield,
    Users,
    Activity,
    User,
    ChevronUp,
    Navigation,
    Globe,
    TrendingUp,
    RefreshCw,
    Flag,
    Shuffle,
    MapPin,
    ChevronDown
} from 'lucide-react';

/**
 * Sidebar Navigation - Collapsible with role-based menus + Profile Avatar
 */
export default function Sidebar({ collapsed, onToggle, userRole }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef(null);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const menuItems = getMenuItems(userRole);

    // Generate user initials
    const getInitials = () => {
        if (!user?.username) return '?';
        return user.username.slice(0, 2).toUpperCase();
    };

    // Notification count
    const [notifCount, setNotifCount] = useState(0);
    useEffect(() => {
        const fetchCount = async () => {
            try {
                const [ordersRes, disruptionsRes] = await Promise.all([
                    api.get('/orders'),
                    api.get('/disruptions/active')
                ]);
                const orders = ordersRes.data?.orders || [];
                const disruptions = disruptionsRes.data?.disruptions || [];
                const atRisk = orders.filter(o => o.status === 'at_risk' || o.status === 'delayed').length;
                setNotifCount(atRisk + disruptions.length);
            } catch { setNotifCount(0); }
        };
        fetchCount();
        const interval = setInterval(fetchCount, 30000);
        return () => clearInterval(interval);
    }, []);
    // Role-based avatar gradient
    const avatarGradient = userRole === 'supplier'
        ? 'from-emerald-500 to-teal-600'
        : userRole === 'admin'
            ? 'from-amber-500 to-orange-600'
            : 'from-blue-500 to-cyan-600';

    const roleBadgeColor = userRole === 'supplier'
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : userRole === 'admin'
            ? 'bg-amber-50 text-amber-700 border-amber-200'
            : 'bg-blue-50 text-blue-700 border-blue-200';

    return (
        <aside className={`fixed left-0 top-0 h-full sidebar-glass z-50 transition-all duration-300 
            flex flex-col ${collapsed ? 'w-20' : 'w-72'}`}
        >
            {/* Branding */}
            <div className="p-6">
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/20">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    {!collapsed && (
                        <div className="flex flex-col">
                            <span className="font-heading font-extrabold text-slate-900 text-xl tracking-tight leading-none">
                                AEGIS
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">
                                Nexus AI
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
                <div className="mb-4">
                    {!collapsed && (
                        <p className="px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                            Main Menu
                        </p>
                    )}
                    <ul className="space-y-1.5">
                        {menuItems.map((item) => (
                            <li key={item.path}>
                                <NavLink
                                    to={item.path}
                                    className={({ isActive }) => `
                                        flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200
                                        ${isActive
                                            ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20'
                                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                                        }
                                        ${collapsed ? 'justify-center' : ''}
                                    `}
                                    title={collapsed ? item.label : undefined}
                                >
                                    <item.icon className="w-5 h-5 flex-shrink-0" />
                                    {!collapsed && (
                                        <span className="text-[14px] font-semibold flex-1">{item.label}</span>
                                    )}
                                    {item.label === 'Notifications' && notifCount > 0 && (
                                        <span className={`${collapsed ? 'absolute -top-1 -right-1' : ''} min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white text-[11px] font-bold flex items-center justify-center shadow-sm`}>
                                            {notifCount}
                                        </span>
                                    )}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </div>
            </nav>

            {/* Bottom: Profile + Actions */}
            <div className="p-4 space-y-2">
                {/* Collapse Button */}
                <button
                    onClick={onToggle}
                    className="w-full h-10 flex items-center justify-center gap-3 rounded-2xl 
                        bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all border border-slate-100"
                >
                    {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                    {!collapsed && <span className="text-sm font-semibold">Collapse</span>}
                </button>

                {/* Profile Avatar Card */}
                <div className="relative" ref={profileRef}>
                    {/* Profile Dropdown (appears above) */}
                    {profileOpen && (
                        <div className={`absolute bottom-full mb-2 ${collapsed ? 'left-0 w-56' : 'left-0 right-0'} bg-white rounded-2xl shadow-2xl shadow-slate-900/10 border border-slate-100 overflow-hidden z-50`}
                            style={{ animation: 'fade-up 0.2s ease-out' }}>
                            <style>{`@keyframes fade-up { 0%{opacity:0;transform:translateY(8px)} 100%{opacity:1;transform:translateY(0)} }`}</style>

                            {/* Profile Header */}
                            <div className="p-4 bg-slate-50 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white text-sm font-black shadow-md`}>
                                        {getInitials()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-900 truncate">{user?.username || 'User'}</p>
                                        <p className="text-[11px] text-slate-400 truncate">{user?.company_name || 'Aegis Nexus'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Menu Items */}
                            <div className="p-2">
                                <button onClick={() => { navigate('/profile'); setProfileOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                                    <User className="w-4 h-4" /> My Profile
                                </button>
                                <button onClick={() => { navigate('/settings'); setProfileOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                                    <Settings className="w-4 h-4" /> Settings
                                </button>
                                <div className="h-px bg-slate-100 my-1" />
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 transition-colors"
                                >
                                    <LogOut className="w-4 h-4" /> Sign Out
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Profile Button */}
                    <button
                        onClick={() => setProfileOpen(!profileOpen)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-2xl transition-all duration-200 group
                            ${profileOpen
                                ? 'bg-slate-100 shadow-inner'
                                : 'hover:bg-slate-50 border border-transparent hover:border-slate-100'
                            }
                            ${collapsed ? 'justify-center' : ''}
                        `}
                    >
                        {/* Avatar Circle */}
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white text-sm font-black shadow-md shadow-slate-900/10 shrink-0 group-hover:scale-105 transition-transform`}>
                            {getInitials()}
                        </div>

                        {!collapsed && (
                            <>
                                <div className="flex-1 text-left min-w-0">
                                    <p className="text-[13px] font-bold text-slate-900 truncate leading-tight">
                                        {user?.username || 'User'}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${roleBadgeColor}`}>
                                            {userRole || 'user'}
                                        </span>
                                    </div>
                                </div>
                                <ChevronUp className={`w-4 h-4 text-slate-400 transition-transform ${profileOpen ? 'rotate-0' : 'rotate-180'}`} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </aside>
    );
}

// Role-based menu configuration
// Role-based menu configuration
function getMenuItems(role) {
    const buyerItems = [
        { path: '/buyer-dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/track', label: 'Shipment Tracker', icon: Navigation },
        { path: '/orders-intake', label: 'Order Intake', icon: Package },
        { path: '/pricing-window', label: 'Pricing Window', icon: Globe },
        { path: '/live-prices', label: 'Live Prices', icon: TrendingUp },
        { path: '/stock-tool', label: 'Stock Tool', icon: RefreshCw },
        { path: '/country-data', label: 'Country Data', icon: Flag },
        { path: '/arbitrage-grid', label: 'Arbitrage Grid', icon: Shuffle },
        { path: '/notifications', label: 'Notifications', icon: Bell },
    ];

    const supplierItems = [
        { path: '/supplier-dashboard', label: 'Dashboard', icon: Activity },
        { path: '/orders-intake', label: 'Order Intake', icon: Package },
        { path: '/alerts', label: 'Alert Center', icon: Bell },
    ];

    switch (role) {
        case 'supplier':
            return supplierItems;
        case 'buyer':
        case 'admin':
        default:
            return buyerItems;
    }
}
