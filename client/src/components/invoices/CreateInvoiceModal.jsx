import { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, FileText, Send, Building2, Package, CheckCircle, Hash } from 'lucide-react';
import api from '../../utils/api';

/**
 * Create Invoice Modal - Redesigned for Premium Light Theme
 */
export default function CreateInvoiceModal({ isOpen, onClose, order, onCreate }) {
    if (!isOpen || !order) return null;

    // Helper to safely parse numbers
    const parseNumber = (val) => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        return parseFloat(String(val).replace(/[^0-9.-]+/g, "")) || 0;
    };

    const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [taxRate, setTaxRate] = useState(18); // Percentage
    const [shippingCost, setShippingCost] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Derived values with safe parsing
    const quantity = parseNumber(order.quantity);
    const unitPrice = parseNumber(order.unit_price) || (order.total_cost / (order.quantity || 1)) || 0;
    const subtotal = quantity * unitPrice;

    const taxAmount = subtotal * (parseNumber(taxRate) / 100);
    const totalAmount = subtotal + taxAmount + parseNumber(shippingCost);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const invoiceData = {
                invoice_number: `INV-${Date.now().toString().slice(-6)}`,
                order_id: order.id,
                supplier_id: order.primary_supplier_id || 1,
                buyer_id: order.buyer_id || 1,
                subtotal: subtotal,
                tax_rate: parseNumber(taxRate) / 100,
                tax_amount: taxAmount,
                shipping_cost: parseNumber(shippingCost),
                total_amount: totalAmount,
                issue_date: new Date().toISOString().split('T')[0],
                due_date: dueDate,
                status: 'pending_approval'
            };

            const response = await api.post('/invoices', invoiceData);

            if (response.data.success) {
                onCreate(response.data.invoiceId);
                onClose();
            }
        } catch (error) {
            console.error('Invoice creation failed:', error);
            const msg = error.response?.data?.error || error.message || 'Unknown error';
            alert(`Failed to create invoice: ${msg}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(val);
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl transition-all duration-500"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-4xl bg-white rounded-[32px] border border-white/50 shadow-2xl shadow-slate-900/20 overflow-hidden animate-in fade-in zoom-in slide-in-from-bottom-8 duration-500 flex flex-col max-h-[90vh]">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all z-20 active:scale-90"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="p-8 pb-6 border-b border-slate-50 bg-slate-50/50">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-[24px] bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                            <FileText className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-100 italic">Clearance Draft</span>
                                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-widest leading-none">
                                    <Hash className="w-3 h-3" /> System Generated
                                </span>
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Generate Invoice</h2>
                            <p className="text-slate-500 text-sm font-medium mt-1">
                                Finalizing financial settlement for <span className="text-slate-900 font-bold">Order #{order.id}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Body - Scrollable */}
                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">

                    {/* Step 1: Configuration */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Issue Date</label>
                            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <Calendar className="w-4 h-4 text-blue-500" />
                                <span className="text-sm font-bold text-slate-700">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Due Date</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-slate-900 text-sm font-bold focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Billing Reference</label>
                            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <Building2 className="w-4 h-4 text-slate-400" />
                                <span className="text-sm font-bold text-slate-700 truncate">PO-{order.id.toString().padStart(6, '0')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Line Items */}
                    <div className="rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/80 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                <tr>
                                    <th className="px-8 py-5">Product Description</th>
                                    <th className="px-8 py-5 text-right">Quantity</th>
                                    <th className="px-8 py-5 text-right">Unit Price</th>
                                    <th className="px-8 py-5 text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                <tr className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                                <Package className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 tracking-tight">{order.product_name}</p>
                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">SKU: {order.id.toString().padStart(6, '0')}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right font-mono font-bold text-slate-600">{quantity.toLocaleString()}</td>
                                    <td className="px-8 py-6 text-right font-mono font-bold text-slate-600">{formatCurrency(unitPrice)}</td>
                                    <td className="px-8 py-6 text-right font-mono font-black text-slate-900">{formatCurrency(subtotal)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Step 3: Totals & Summary */}
                    <div className="flex flex-col md:flex-row justify-between items-start gap-12">
                        <div className="max-w-md space-y-4">
                            <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
                                <h4 className="flex items-center gap-2 text-xs font-black text-blue-700 uppercase tracking-widest mb-2">
                                    <Activity className="w-3.5 h-3.5" /> Compliance Check
                                </h4>
                                <p className="text-xs text-blue-600/80 font-medium leading-relaxed">
                                    This invoice will be transmitted through Aegis Nexus Smart Contract layer for multi-agent validation. Please verify tax jurisdiction and totals.
                                </p>
                            </div>
                        </div>

                        <div className="w-full md:w-96 space-y-5">
                            <div className="flex justify-between items-center text-sm px-2">
                                <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Net Position</span>
                                <span className="font-mono font-bold text-slate-900">{formatCurrency(subtotal)}</span>
                            </div>

                            <div className="flex justify-between items-center text-sm px-2">
                                <div className="flex items-center gap-3">
                                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Tax Rate (%)</span>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={taxRate}
                                        onChange={(e) => setTaxRate(e.target.value)}
                                        className="w-16 p-2 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs font-black text-slate-900 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                                <span className="font-mono font-bold text-slate-900">{formatCurrency(taxAmount)}</span>
                            </div>

                            <div className="flex justify-between items-center text-sm px-2">
                                <div className="flex items-center gap-3">
                                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Logistics Fee</span>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                                        <input
                                            type="number"
                                            min="0"
                                            value={shippingCost}
                                            onChange={(e) => setShippingCost(e.target.value)}
                                            className="w-28 pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-right text-xs font-black text-slate-900 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <span className="font-mono font-bold text-slate-900">{formatCurrency(shippingCost)}</span>
                            </div>

                            <div className="pt-6 border-t border-slate-100 flex justify-between items-center bg-slate-50/50 p-6 rounded-[24px]">
                                <span className="text-base font-black text-slate-900 tracking-tight uppercase">Settlement Total</span>
                                <span className="text-2xl font-black text-emerald-600 font-mono tracking-tighter">{formatCurrency(totalAmount)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-8 border-t border-slate-50 bg-white flex justify-between items-center">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-8 py-4 rounded-xl border border-slate-200 text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-95"
                    >
                        Discard
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="relative group px-12 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-900/20 transition-all hover:bg-slate-800 hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                    >
                        <span className="relative z-10 flex items-center gap-3">
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Syncing...</span>
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    <span>Transmit Invoice</span>
                                </>
                            )}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}

// Custom styles for number inputs
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
      input[type=number]::-webkit-inner-spin-button, 
      input[type=number]::-webkit-outer-spin-button { 
        -webkit-appearance: none; 
        margin: 0; 
      }
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #e2e8f0;
        border-radius: 10px;
      }
    `;
    document.head.appendChild(style);
}
