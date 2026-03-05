import { useState, useEffect } from 'react';
import { X, Package, Truck, DollarSign, Calendar, Factory, ChevronDown, Loader2, ShoppingCart, MapPin, Star, Clock } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import api from '../../utils/api';

// Product catalog by specialty
const productCatalog = {
    'Electronics': [
        { name: 'Industrial Microcontrollers', basePrice: 15.00 },
        { name: 'Circuit Boards', basePrice: 12.50 },
        { name: 'Semiconductor Chips', basePrice: 25.00 },
        { name: 'LED Display Modules', basePrice: 35.00 },
        { name: 'Power Supply Units', basePrice: 42.00 },
        { name: 'Sensor Arrays', basePrice: 18.50 },
    ],
    'Automotive Parts': [
        { name: 'Engine Control Modules', basePrice: 125.00 },
        { name: 'Brake Assemblies', basePrice: 85.00 },
        { name: 'Transmission Components', basePrice: 165.00 },
        { name: 'Fuel Injectors', basePrice: 55.00 },
        { name: 'Exhaust Systems', basePrice: 95.00 },
    ],
    'Raw Materials': [
        { name: 'Steel Coils (per ton)', basePrice: 850.00 },
        { name: 'Aluminum Sheets', basePrice: 425.00 },
        { name: 'Copper Wire (per roll)', basePrice: 350.00 },
        { name: 'Titanium Alloy', basePrice: 1200.00 },
        { name: 'Carbon Fiber Sheets', basePrice: 680.00 },
    ],
    'Textiles': [
        { name: 'Industrial Fabric (per bolt)', basePrice: 120.00 },
        { name: 'Kevlar Material', basePrice: 280.00 },
        { name: 'Cotton Canvas', basePrice: 65.00 },
        { name: 'Synthetic Fiber Blend', basePrice: 95.00 },
        { name: 'Fire-Resistant Fabric', basePrice: 175.00 },
    ],
};

export default function PlaceOrderModal({ isOpen, onClose, onSubmit }) {
    const { formatCurrency } = useSettings();
    const [suppliers, setSuppliers] = useState([]);
    const [selectedSupplierId, setSelectedSupplierId] = useState('');
    const [selectedProductName, setSelectedProductName] = useState('');
    const [quantity, setQuantity] = useState(1000);
    const [deliveryDate, setDeliveryDate] = useState('');
    const [loadingSuppliers, setLoadingSuppliers] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchSuppliers();
            setSelectedSupplierId('');
            setSelectedProductName('');
            setQuantity(1000);

            const defaultDate = new Date();
            defaultDate.setDate(defaultDate.getDate() + 30);
            setDeliveryDate(defaultDate.toISOString().split('T')[0]);
        }
    }, [isOpen]);

    const fetchSuppliers = async () => {
        setLoadingSuppliers(true);
        try {
            const response = await api.get('/suppliers');
            const supplierList = response.data?.suppliers || response.data || [];
            setSuppliers(Array.isArray(supplierList) ? supplierList : []);
        } catch (error) {
            console.error('Failed to fetch suppliers:', error);
            setSuppliers([
                { id: 1, name: 'Shanghai Electronics Ltd', specialty: 'Electronics', cost_per_unit: 15.00, lead_time_days: 18, reliability_score: 89, location: 'Shanghai, China' },
                { id: 2, name: 'TechForge Industries', specialty: 'Electronics', cost_per_unit: 12.50, lead_time_days: 14, reliability_score: 92, location: 'Shenzhen, China' },
                { id: 3, name: 'Nordic Steel AB', specialty: 'Raw Materials', cost_per_unit: 18.75, lead_time_days: 21, reliability_score: 97, location: 'Stockholm, Sweden' },
                { id: 4, name: 'Mumbai Textiles Co', specialty: 'Textiles', cost_per_unit: 9.80, lead_time_days: 12, reliability_score: 84, location: 'Mumbai, India' },
                { id: 5, name: 'Detroit AutoParts Inc', specialty: 'Automotive Parts', cost_per_unit: 22.00, lead_time_days: 7, reliability_score: 95, location: 'Detroit, USA' },
            ]);
        } finally {
            setLoadingSuppliers(false);
        }
    };

    const selectedSupplier = suppliers.find(s => s.id === parseInt(selectedSupplierId));
    const availableProducts = selectedSupplier ? productCatalog[selectedSupplier.specialty] || [] : [];
    const selectedProduct = availableProducts.find(p => p.name === selectedProductName);

    const getUnitPrice = () => {
        if (!selectedSupplier || !selectedProduct) return 0;
        return selectedProduct.basePrice * (selectedSupplier.cost_per_unit / 15);
    };

    const calculateTotal = () => getUnitPrice() * quantity;

    const handleSupplierChange = (e) => {
        const supplierId = e.target.value;
        setSelectedSupplierId(supplierId);
        setSelectedProductName('');

        const supplier = suppliers.find(s => s.id === parseInt(supplierId));
        if (supplier && supplier.lead_time_days) {
            const eta = new Date();
            eta.setDate(eta.getDate() + supplier.lead_time_days);
            setDeliveryDate(eta.toISOString().split('T')[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedSupplier || !selectedProduct) return;

        setSubmitting(true);
        try {
            await onSubmit?.({
                supplier_id: selectedSupplier.id,
                product_name: selectedProduct.name,
                quantity,
                unit_price: getUnitPrice(),
                total_cost: calculateTotal(),
                expected_delivery: deliveryDate,
            });
            onClose();
        } catch (error) {
            console.error('Failed to place order:', error);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl shadow-slate-900/10 border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                            <ShoppingCart className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 tracking-tight">New Procurement</h2>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Select supplier & product</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                        <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Supplier Dropdown */}
                    <div>
                        <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
                            <Factory className="w-3.5 h-3.5" /> Supplier Company
                        </label>
                        {loadingSuppliers ? (
                            <div className="flex items-center gap-2 py-3 text-slate-400 text-sm">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Loading suppliers...</span>
                            </div>
                        ) : (
                            <div className="relative">
                                <select
                                    value={selectedSupplierId}
                                    onChange={handleSupplierChange}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 appearance-none cursor-pointer focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                                    required
                                >
                                    <option value="">Select a supplier...</option>
                                    {suppliers.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} — {s.specialty} ({s.location})
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        )}
                    </div>

                    {/* Supplier Info Card */}
                    {selectedSupplier && (
                        <div className="flex items-center gap-4 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                                <MapPin className="w-3 h-3 text-slate-400" /> {selectedSupplier.location}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600">
                                <Star className="w-3 h-3" /> {selectedSupplier.reliability_score}%
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600">
                                <Clock className="w-3 h-3" /> {selectedSupplier.lead_time_days}d lead
                            </div>
                        </div>
                    )}

                    {/* Product Dropdown */}
                    {selectedSupplier && (
                        <div>
                            <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
                                <Package className="w-3.5 h-3.5" /> Product ({selectedSupplier.specialty})
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedProductName}
                                    onChange={(e) => setSelectedProductName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 appearance-none cursor-pointer focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                                    required
                                >
                                    <option value="">Select a product...</option>
                                    {availableProducts.map(p => (
                                        <option key={p.name} value={p.name}>
                                            {p.name} — {formatCurrency(p.basePrice * (selectedSupplier.cost_per_unit / 15))}/unit
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    )}

                    {/* Quantity & Delivery */}
                    {selectedProduct && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Quantity</label>
                                <input
                                    type="number"
                                    min="100"
                                    step="100"
                                    value={quantity}
                                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 font-mono focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
                                    <Calendar className="w-3.5 h-3.5" /> Delivery Date
                                </label>
                                <input
                                    type="date"
                                    value={deliveryDate}
                                    onChange={(e) => setDeliveryDate(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 font-mono focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {/* Order Summary */}
                    {selectedProduct && quantity > 0 && (
                        <div className="p-5 bg-emerald-50/50 border border-emerald-200/50 rounded-2xl">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-widest">Order Summary</span>
                                <DollarSign className="w-4 h-4 text-emerald-500" />
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500 font-medium">Unit Price:</span>
                                    <span className="font-bold text-slate-700 font-mono">{formatCurrency(getUnitPrice())}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500 font-medium">Quantity:</span>
                                    <span className="font-bold text-slate-700 font-mono">{quantity.toLocaleString()}</span>
                                </div>
                                <div className="border-t border-emerald-200/50 my-2" />
                                <div className="flex justify-between text-lg">
                                    <span className="font-bold text-slate-900">Total:</span>
                                    <span className="font-black text-emerald-600 font-mono">{formatCurrency(calculateTotal())}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!selectedSupplier || !selectedProduct || quantity < 100 || submitting}
                            className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-blue-200"
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                            <span>{submitting ? 'Processing...' : 'Place Order'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
