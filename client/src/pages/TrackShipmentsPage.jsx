import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import ControlTowerLayout from '../components/layout/ControlTowerLayout';
import { Truck, MapPin, Clock, Package, CheckCircle, Circle, AlertTriangle, ChevronRight, Globe, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../utils/api';

// Fix Leaflet default icon issue with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons
const createIcon = (color) => new L.DivIcon({
    className: 'custom-marker',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
});

const blueIcon = createIcon('#2563EB');
const greenIcon = createIcon('#059669');
const redIcon = createIcon('#E11D48');

// Known location coordinates for mapping
const locationCoords = {
    // Asia
    'Shanghai, China': [31.2304, 121.4737], 'Shanghai': [31.2304, 121.4737],
    'Shenzhen, China': [22.5431, 114.0579], 'Shenzhen': [22.5431, 114.0579],
    'Mumbai, India': [19.0760, 72.8777], 'Mumbai': [19.0760, 72.8777],
    'Chennai, India': [13.0827, 80.2707], 'Chennai': [13.0827, 80.2707],
    'Singapore': [1.3521, 103.8198],
    'Tokyo, Japan': [35.6762, 139.6503], 'Tokyo': [35.6762, 139.6503],
    'Yokohama, Japan': [35.4437, 139.6380], 'Yokohama': [35.4437, 139.6380],
    'Busan, South Korea': [35.1796, 129.0756], 'Busan': [35.1796, 129.0756],
    'Dubai, UAE': [25.2048, 55.2708], 'Dubai': [25.2048, 55.2708],
    'Hong Kong': [22.3193, 114.1694],
    'Taipei, Taiwan': [25.0330, 121.5654], 'Taipei': [25.0330, 121.5654],
    'Bangkok, Thailand': [13.7563, 100.5018], 'Bangkok': [13.7563, 100.5018],
    'Ho Chi Minh City': [10.8231, 106.6297],
    'Jakarta, Indonesia': [-6.2088, 106.8456], 'Jakarta': [-6.2088, 106.8456],
    'Colombo': [6.9271, 79.8612], 'Port of Colombo': [6.9271, 79.8612],

    // Americas
    'Los Angeles, USA': [33.9416, -118.4085], 'Los Angeles': [33.9416, -118.4085],
    'New York, USA': [40.7128, -74.0060], 'New York': [40.7128, -74.0060],
    'Detroit, USA': [42.3314, -83.0458], 'Detroit': [42.3314, -83.0458],
    'Seattle': [47.6062, -122.3321], 'Seattle, USA': [47.6062, -122.3321],
    'Chicago': [41.8781, -87.6298], 'Chicago, USA': [41.8781, -87.6298],
    'Houston': [29.7604, -95.3698], 'Houston, USA': [29.7604, -95.3698],
    'Dallas': [32.7767, -96.7970], 'Dallas, USA': [32.7767, -96.7970],
    'San Antonio, Texas': [29.4241, -98.4936], 'San Antonio': [29.4241, -98.4936],
    'Toledo, Ohio': [41.6528, -83.5379], 'Toledo': [41.6528, -83.5379],
    'Anchorage, Alaska': [61.2181, -149.9003], 'Anchorage': [61.2181, -149.9003],
    'Miami': [25.7617, -80.1918], 'Miami, USA': [25.7617, -80.1918],
    'São Paulo, Brazil': [-23.5505, -46.6333], 'São Paulo': [-23.5505, -46.6333],
    'Mexico City': [19.4326, -99.1332], 'Mexico City, Mexico': [19.4326, -99.1332],

    // Europe
    'Rotterdam, Netherlands': [51.9225, 4.4792], 'Rotterdam': [51.9225, 4.4792],
    'Hamburg, Germany': [53.5511, 9.9937], 'Hamburg': [53.5511, 9.9937],
    'Stockholm, Sweden': [59.3293, 18.0686], 'Stockholm': [59.3293, 18.0686],
    'London, UK': [51.5074, -0.1278], 'London': [51.5074, -0.1278],
    'Berlin, Germany': [52.5200, 13.4050], 'Berlin': [52.5200, 13.4050],
    'Warsaw, Poland': [52.2297, 21.0122], 'Warsaw': [52.2297, 21.0122],
    'Moscow, Russia': [55.7558, 37.6173], 'Moscow': [55.7558, 37.6173],
    'Amsterdam': [52.3676, 4.9041],
    'Antwerp, Belgium': [51.2194, 4.4025], 'Antwerp': [51.2194, 4.4025],
    'Barcelona, Spain': [41.3874, 2.1686], 'Barcelona': [41.3874, 2.1686],
    'Marseille, France': [43.2965, 5.3698], 'Marseille': [43.2965, 5.3698],

    // Oceania
    'Sydney, Australia': [-33.8688, 151.2093], 'Sydney': [-33.8688, 151.2093],

    // Africa
    'Lagos, Nigeria': [6.5244, 3.3792], 'Lagos': [6.5244, 3.3792],
    'Cape Town': [-33.9249, 18.4241],
    'Johannesburg, South Africa': [-26.2041, 28.0473], 'Johannesburg': [-26.2041, 28.0473],

    // Middle East / Turkey
    'Istanbul, Turkey': [41.0082, 28.9784], 'Istanbul': [41.0082, 28.9784],

    // More Asia
    'Seoul, South Korea': [37.5665, 126.9780], 'Seoul': [37.5665, 126.9780],
    'Ho Chi Minh City, Vietnam': [10.8231, 106.6297],

    // Canada
    'Toronto, Canada': [43.6532, -79.3832], 'Toronto': [43.6532, -79.3832],

    // Key Waterways
    'Panama Canal': [9.0801, -79.6813],
    'Suez Canal': [30.4574, 32.3498],
    'Strait of Malacca': [2.5, 101.5],
};

function getCoords(locationName) {
    if (!locationName) return null;
    // Try exact match first
    if (locationCoords[locationName]) return locationCoords[locationName];
    // Try partial match
    const key = Object.keys(locationCoords).find(k =>
        locationName.toLowerCase().includes(k.toLowerCase()) ||
        k.toLowerCase().includes(locationName.toLowerCase())
    );
    return key ? locationCoords[key] : null;
}

function getMarkerIcon(status) {
    switch (status) {
        case 'delivered': return greenIcon;
        case 'delayed': return redIcon;
        case 'in_transit': return blueIcon;
        default: return blueIcon;
    }
}

function getOrderIcon(status) {
    switch (status) {
        case 'at_risk': case 'disrupted': case 'delayed': return redIcon;
        case 'delivered': case 'completed': return greenIcon;
        default: return blueIcon;
    }
}

function getOrderStatusColor(status) {
    switch (status) {
        case 'at_risk': case 'disrupted': case 'delayed': return '#E11D48';
        case 'delivered': case 'completed': return '#059669';
        default: return '#2563EB';
    }
}

export default function TrackShipmentsPage() {
    const { user } = useAuth();
    const { formatFriendlyDate } = useSettings();
    const [shipments, setShipments] = useState([]);
    const [orders, setOrders] = useState([]);
    const [disruptions, setDisruptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedShipment, setSelectedShipment] = useState(null);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        try {
            const [shipmentsRes, disruptionsRes, ordersRes] = await Promise.all([
                api.get('/shipments'),
                api.get('/disruptions/active').catch(() => ({ data: { disruptions: [] } })),
                api.get('/orders').catch(() => ({ data: { orders: [] } }))
            ]);
            const shipmentsData = shipmentsRes.data.shipments || [];
            setShipments(shipmentsData);
            setDisruptions(disruptionsRes.data?.disruptions || []);
            setOrders(ordersRes.data?.orders || ordersRes.data || []);

            setSelectedShipment(prev => {
                if (prev && shipmentsData.length > 0) {
                    const updated = shipmentsData.find(s => s.id === prev.id);
                    return updated || prev;
                }
                return shipmentsData.length > 0 ? shipmentsData[0] : null;
            });
        } catch (error) {
            console.error('Failed to load tracking data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getShipmentDisruption = (shipment) => {
        if (!shipment || disruptions.length === 0) return null;
        return disruptions.find(d => {
            if (d.scope === 'global') return true;
            const affectedRoutes = Array.isArray(d.affected_routes)
                ? d.affected_routes
                : (typeof d.affected_routes === 'string' && d.affected_routes.length > 0 ? JSON.parse(d.affected_routes || '[]') : []);
            const affectedModes = Array.isArray(d.affected_transport_modes)
                ? d.affected_transport_modes
                : (typeof d.affected_transport_modes === 'string' && d.affected_transport_modes.length > 0 ? JSON.parse(d.affected_transport_modes || '[]') : []);
            const hasRouteRestriction = affectedRoutes.length > 0;
            const hasModeRestriction = affectedModes.length > 0;
            if (!hasRouteRestriction && !hasModeRestriction) return false;
            let passesRoute = true;
            if (hasRouteRestriction) passesRoute = affectedRoutes.some(r => shipment.route?.toLowerCase().includes(r.toLowerCase()));
            let passesMode = true;
            if (hasModeRestriction) passesMode = affectedModes.some(m => shipment.transport_mode?.toLowerCase() === m.toLowerCase());
            return passesRoute && passesMode;
        }) || null;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    };

    const getTrackingSteps = (shipment) => {
        const disruption = getShipmentDisruption(shipment);
        const isDelayed = shipment.status === 'delayed' || !!disruption;
        const isDelivered = shipment.status === 'delivered';
        const isInTransit = shipment.status === 'in_transit' || isDelayed;
        const disruptionDesc = disruption ? `⚠️ ${disruption.title || disruption.type}: ${disruption.impact_description || 'Disruption detected'}` : null;

        return [
            { id: 1, title: 'Order Confirmed', description: 'Your order has been placed', status: 'completed', date: shipment.departure_date },
            { id: 2, title: 'Shipped', description: `Package left ${shipment.supplier_location || 'warehouse'}`, status: 'completed', date: shipment.departure_date },
            {
                id: 3, title: isDelayed ? '⚠️ In Transit - DISRUPTION ALERT' : 'In Transit',
                description: isDelayed ? (disruptionDesc || `Alert: Shipment delayed at ${shipment.current_location || 'transit point'}`) : (shipment.current_location || 'On the way'),
                status: isDelayed ? 'delayed' : (isInTransit ? 'current' : (isDelivered ? 'completed' : 'pending')),
                isRisk: isDelayed, disruption
            },
            { id: 4, title: 'Out for Delivery', description: 'Package is out for delivery', status: isDelivered ? 'completed' : 'pending' },
            { id: 5, title: 'Delivered', description: 'Package delivered', status: isDelivered ? 'completed' : 'pending', date: isDelivered ? shipment.eta : null },
        ];
    };

    const getProgressPercent = (status) => {
        switch (status) {
            case 'pending': return 0;
            case 'in_transit': return 50;
            case 'delayed': return 50;
            case 'out_for_delivery': return 75;
            case 'delivered': return 100;
            default: return 25;
        }
    };

    // Build ALL markers (shipments + orders) and offset co-located ones
    const rawShipmentMarkers = shipments.map(s => {
        const coords = getCoords(s.current_location);
        return coords ? { ...s, coords, markerType: 'shipment', markerKey: `ship-${s.id}` } : null;
    }).filter(Boolean);

    const rawOrderMarkers = orders.map(o => {
        const supplierLoc = o.supplier_location || o.supplier_name;
        const coords = getCoords(supplierLoc);
        return coords ? { ...o, coords, markerType: 'order', markerKey: `order-${o.id}` } : null;
    }).filter(Boolean);

    // Merge and offset co-located markers
    const allRawMarkers = [...rawShipmentMarkers, ...rawOrderMarkers];
    const coordCounts = {};
    const allMarkers = allRawMarkers.map(m => {
        const key = `${m.coords[0].toFixed(4)},${m.coords[1].toFixed(4)}`;
        coordCounts[key] = (coordCounts[key] || 0);
        const offset = coordCounts[key] * 1.8; // offset in degrees
        coordCounts[key]++;
        if (offset > 0) {
            const angle = (offset / 1.8) * (Math.PI / 3); // spread in a circle
            return { ...m, coords: [m.coords[0] + Math.cos(angle) * offset, m.coords[1] + Math.sin(angle) * offset] };
        }
        return m;
    });

    // Sort: render red (at_risk/delayed) LAST so they appear on top
    const isRed = (m) => ['at_risk', 'disrupted', 'delayed'].includes(m.status);
    allMarkers.sort((a, b) => (isRed(a) ? 1 : 0) - (isRed(b) ? 1 : 0));

    // Split back for rendering
    const mapMarkers = allMarkers.filter(m => m.markerType === 'shipment');
    const orderMarkers = allMarkers.filter(m => m.markerType === 'order');

    return (
        <ControlTowerLayout>
            {() => (
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                                    <Navigation className="w-6 h-6 text-blue-600" />
                                </div>
                                Shipment Tracker
                            </h1>
                            <p className="text-sm font-medium text-slate-500 mt-1">
                                Real-time tracking and logistics intelligence
                            </p>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-100/50 rounded-xl shadow-sm">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <span className="text-sm font-bold text-emerald-700 uppercase tracking-widest">Live Tracking</span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-32">
                            <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
                        </div>
                    ) : shipments.length === 0 ? (
                        <div className="bg-white rounded-[32px] border border-slate-200/60 shadow-xl shadow-slate-200/20 p-16 text-center">
                            <div className="w-20 h-20 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-6">
                                <Truck className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">No Active Shipments</h3>
                            <p className="text-slate-500 font-medium max-w-sm mx-auto">You don't have any shipments currently in transit. New orders will appear here automatically.</p>
                        </div>
                    ) : (
                        <>
                            {/* ═══ INTERACTIVE MAP ═══ */}
                            {(mapMarkers.length > 0 || orderMarkers.length > 0) && (
                                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                                                <Globe className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-900">Global Shipment Map</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
                                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> In Transit</span>
                                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> Delivered</span>
                                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-600" /> At Risk</span>
                                        </div>
                                    </div>
                                    <div style={{ height: 360 }}>
                                        <MapContainer
                                            center={[20, 40]}
                                            zoom={2}
                                            style={{ height: '100%', width: '100%' }}
                                            scrollWheelZoom={true}
                                            zoomControl={true}
                                        >
                                            <TileLayer
                                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            />
                                            {mapMarkers.map((shipment) => (
                                                <Marker
                                                    key={shipment.markerKey}
                                                    position={shipment.coords}
                                                    icon={getMarkerIcon(shipment.status)}
                                                    eventHandlers={{ click: () => setSelectedShipment(shipment) }}
                                                >
                                                    <Popup>
                                                        <div style={{ minWidth: 180, fontFamily: 'system-ui' }}>
                                                            <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 4 }}>
                                                                {shipment.product_name || `Order #${shipment.order_id}`}
                                                            </div>
                                                            <div style={{ fontSize: 11, color: '#64748B', marginBottom: 6 }}>
                                                                {shipment.supplier_name}
                                                            </div>
                                                            <div style={{ fontSize: 11, display: 'flex', justifyContent: 'space-between' }}>
                                                                <span style={{ fontWeight: 700, textTransform: 'uppercase', color: shipment.status === 'delivered' ? '#059669' : shipment.status === 'delayed' ? '#E11D48' : '#2563EB' }}>
                                                                    {shipment.status?.replace('_', ' ')}
                                                                </span>
                                                                <span style={{ color: '#94A3B8' }}>
                                                                    📍 {shipment.current_location}
                                                                </span>
                                                            </div>
                                                            <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                                                                Route: {shipment.route}
                                                            </div>
                                                        </div>
                                                    </Popup>
                                                </Marker>
                                            ))}
                                            {/* Order origin markers */}
                                            {orderMarkers.map((order, idx) => (
                                                <Marker
                                                    key={order.markerKey || `order-${idx}`}
                                                    position={order.coords}
                                                    icon={getOrderIcon(order.status)}
                                                >
                                                    <Popup>
                                                        <div style={{ minWidth: 180, fontFamily: 'system-ui' }}>
                                                            <div style={{ fontSize: 10, fontWeight: 700, color: getOrderStatusColor(order.status), textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>📦 Order #{order.id}</div>
                                                            <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 4 }}>
                                                                {order.product_name || `Order #${order.id}`}
                                                            </div>
                                                            <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>
                                                                Supplier: {order.supplier_name || 'N/A'}
                                                            </div>
                                                            <div style={{ fontSize: 11, color: '#64748B' }}>
                                                                📍 {order.supplier_location || 'Supplier Location'}
                                                            </div>
                                                            <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                                                                Qty: {order.quantity?.toLocaleString()} • Status: <span style={{ fontWeight: 700, color: getOrderStatusColor(order.status) }}>{order.status?.replace('_', ' ')}</span>
                                                            </div>
                                                            {order.expected_delivery && (
                                                                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
                                                                    ETA: {new Date(order.expected_delivery).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </Popup>
                                                </Marker>
                                            ))}
                                        </MapContainer>
                                    </div>
                                </div>
                            )}

                            {/* ═══ SHIPMENT LIST + DETAIL ═══ */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Shipment List Sidebar */}
                                <div className="lg:col-span-1 space-y-4 lg:max-h-[calc(100vh-200px)] lg:overflow-y-auto pr-2 custom-scrollbar">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 pl-2">
                                        Active Shipments ({shipments.length})
                                    </h3>
                                    {shipments.map((shipment) => {
                                        const isSelected = selectedShipment?.id === shipment.id;
                                        const isDelivered = shipment.status === 'delivered';
                                        const isDelayed = shipment.status === 'delayed';

                                        return (
                                            <button
                                                key={shipment.id}
                                                onClick={() => setSelectedShipment(shipment)}
                                                className={`w-full text-left p-5 rounded-[24px] border transition-all duration-300 ${isSelected
                                                    ? 'bg-slate-900 border-slate-900 shadow-xl shadow-slate-900/20 translate-x-2'
                                                    : 'bg-white border-slate-200/60 hover:border-slate-300 hover:shadow-md'
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex gap-4">
                                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-white/10' :
                                                            isDelivered ? 'bg-emerald-50' :
                                                                isDelayed ? 'bg-rose-50' : 'bg-blue-50'
                                                            }`}>
                                                            <Package className={`w-6 h-6 ${isSelected ? 'text-white' :
                                                                isDelivered ? 'text-emerald-500' :
                                                                    isDelayed ? 'text-rose-500' : 'text-blue-500'
                                                                }`} />
                                                        </div>
                                                        <div>
                                                            <div className={`font-black tracking-tight mb-0.5 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                                                {shipment.product_name || `Order #${shipment.order_id}`}
                                                            </div>
                                                            <div className={`text-xs font-medium ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                                                                {shipment.supplier_name || 'Generic Corp'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className={`w-5 h-5 transition-transform ${isSelected ? 'text-white translate-x-1' : 'text-slate-300'}`} />
                                                </div>

                                                <div className={`mt-5 pt-5 border-t border-dashed flex items-center justify-between transition-colors ${isSelected ? 'border-white/10' : 'border-slate-100'}`}>
                                                    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg ${isDelivered ? 'bg-emerald-500/10 text-emerald-600' :
                                                        isDelayed ? 'bg-rose-500/10 text-rose-600' :
                                                            isSelected ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-50 text-blue-600'
                                                        }`}>
                                                        {shipment.status?.replace('_', ' ')}
                                                    </span>
                                                    <span className={`text-xs font-bold ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                                                        ETA: {new Date(shipment.eta).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Shipment Detail Main View */}
                                <div className="lg:col-span-2">
                                    {selectedShipment && (
                                        <div className="bg-white rounded-[32px] border border-slate-200/60 shadow-2xl shadow-slate-200/20 flex flex-col lg:max-h-[calc(100vh-200px)] overflow-hidden">

                                            {/* Header Segment */}
                                            <div className="p-8 border-b border-slate-100 flex-shrink-0 bg-slate-50/50">
                                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                                                    <div>
                                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Tracking Identifier</div>
                                                        <div className="font-mono text-3xl font-black text-slate-900 tracking-tighter">
                                                            SHP-{selectedShipment.id?.toString().padStart(6, '0')}
                                                        </div>
                                                    </div>
                                                    <div className="sm:text-right">
                                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Expected Delivery</div>
                                                        <div className="text-xl font-black text-emerald-600">{formatDate(selectedShipment.eta)}</div>
                                                    </div>
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="mt-8">
                                                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner flex">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-1000 ease-out ${(selectedShipment.status === 'delayed' || getShipmentDisruption(selectedShipment))
                                                                ? 'bg-gradient-to-r from-rose-400 to-rose-500'
                                                                : 'bg-gradient-to-r from-slate-800 to-slate-900'
                                                                }`}
                                                            style={{ width: `${getProgressPercent(selectedShipment.status)}%` }}
                                                        />
                                                    </div>
                                                    <div className="flex justify-between mt-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                        <span className={getProgressPercent(selectedShipment.status) >= 0 ? "text-slate-900" : ""}>Ordered</span>
                                                        <span className={getProgressPercent(selectedShipment.status) >= 50 ? "text-slate-900" : ""}>Shipped</span>
                                                        <span className={getProgressPercent(selectedShipment.status) > 50 ? "text-slate-900" : ""}>In Transit</span>
                                                        <span className={getProgressPercent(selectedShipment.status) === 100 ? "text-emerald-600" : ""}>Delivered</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Timeline */}
                                            <div className="p-10 overflow-y-auto flex-1 custom-scrollbar bg-white">
                                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Delivery Journey</h4>
                                                <div className="space-y-0 relative">
                                                    {getTrackingSteps(selectedShipment).map((step, index, array) => (
                                                        <div key={step.id} className="relative flex gap-6">
                                                            {index < array.length - 1 && (
                                                                <div className={`absolute left-[19px] top-10 w-0.5 h-full ${step.status === 'completed' ? 'bg-slate-900' :
                                                                    step.status === 'delayed' ? 'bg-rose-200' : 'bg-slate-100'
                                                                    }`} />
                                                            )}

                                                            <div className="relative z-10 flex-shrink-0 w-10 h-10 bg-white flex items-center justify-center">
                                                                <div className={`w-full h-full rounded-full flex items-center justify-center border-2 transition-colors ${step.status === 'completed'
                                                                    ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/20'
                                                                    : step.status === 'delayed'
                                                                        ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/30 ring-4 ring-rose-50 animate-pulse'
                                                                        : step.status === 'current'
                                                                            ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/30 ring-4 ring-blue-50'
                                                                            : 'bg-white border-slate-200 text-slate-300'
                                                                    }`}>
                                                                    {step.status === 'completed' ? <CheckCircle className="w-5 h-5" /> :
                                                                        step.status === 'delayed' ? <AlertTriangle className="w-5 h-5" /> :
                                                                            step.status === 'current' ? <Truck className="w-5 h-5" /> :
                                                                                <Circle className="w-3 h-3 fill-current" />}
                                                                </div>
                                                            </div>

                                                            <div className="flex-1 pb-10 pt-1">
                                                                <div className="flex flex-wrap items-center justify-between gap-y-2">
                                                                    <h5 className={`text-base font-black tracking-tight ${step.status === 'delayed' ? 'text-rose-600' :
                                                                        step.status === 'completed' || step.status === 'current' ? 'text-slate-900' : 'text-slate-400'
                                                                        }`}>{step.title}</h5>
                                                                    {step.date && (
                                                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2.5 py-1 rounded-md">
                                                                            {formatDate(step.date)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {step.status !== 'delayed' && (
                                                                    <p className={`text-sm font-medium mt-1.5 ${step.status === 'completed' || step.status === 'current' ? 'text-slate-600' : 'text-slate-400'}`}>
                                                                        {step.description}
                                                                    </p>
                                                                )}
                                                                {step.status === 'current' && (
                                                                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
                                                                        <MapPin className="w-4 h-4 text-slate-400" />
                                                                        <span className="text-xs font-bold uppercase tracking-widest">Current: {selectedShipment.current_location}</span>
                                                                    </div>
                                                                )}
                                                                {step.status === 'delayed' && step.disruption && (
                                                                    <div className="mt-4 p-5 bg-rose-50 border border-rose-100 rounded-2xl">
                                                                        <div className="flex items-start gap-3">
                                                                            <div className="p-2 bg-white rounded-xl shadow-sm border border-rose-100 shrink-0">
                                                                                <AlertTriangle className="w-5 h-5 text-rose-500" />
                                                                            </div>
                                                                            <div>
                                                                                <div className="flex items-center gap-3 mb-1">
                                                                                    <span className="text-sm font-black text-rose-900 tracking-tight">{step.disruption.title}</span>
                                                                                    {step.disruption.severity && (
                                                                                        <span className="px-2 py-0.5 bg-rose-500 text-white rounded-md text-[10px] font-black uppercase tracking-widest shadow-sm">
                                                                                            {step.disruption.severity}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                <p className="text-sm font-medium text-rose-700/80 leading-relaxed mb-3">
                                                                                    {step.disruption.impact_description || step.disruption.description}
                                                                                </p>
                                                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-rose-100 rounded-lg text-rose-600">
                                                                                    <MapPin className="w-3.5 h-3.5" />
                                                                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                                                                        Impact Zone: {selectedShipment.current_location || 'Transit Route'}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Bottom Metadata */}
                                            <div className="p-8 bg-slate-50/80 border-t border-slate-100">
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                                    <div>
                                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Commodity</div>
                                                        <div className="text-sm font-bold text-slate-900 truncate">{selectedShipment.product_name || 'N/A'}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Volume</div>
                                                        <div className="text-sm font-mono font-bold text-slate-900">{selectedShipment.quantity?.toLocaleString() || '—'} units</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Trade Lane</div>
                                                        <div className="text-sm font-bold text-slate-900 truncate">{selectedShipment.route || 'N/A'}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Transport</div>
                                                        <div className="text-sm font-bold text-slate-900 capitalize">
                                                            {selectedShipment.transport_mode === 'sea' ? '🚢 Sea Freight' :
                                                                selectedShipment.transport_mode === 'air' ? '✈️ Air Freight' :
                                                                    selectedShipment.transport_mode === 'rail' ? '🚂 Rail' : '🚛 Road'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </ControlTowerLayout>
    );
}
