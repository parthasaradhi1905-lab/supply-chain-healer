import { useRef, useEffect } from 'react';
import {
    X, Calendar, DollarSign, FileText, Download,
    CheckCircle, XCircle, Clock, Building2, MapPin,
    Globe, CreditCard, Printer, AlertCircle, Package
} from 'lucide-react';
import api from '../../utils/api';

/**
 * View Invoice Modal - Redesigned for Premium Light Theme
 * Includes defensive rendering and validation
 */
export default function ViewInvoiceModal({ isOpen, onClose, invoice, userRole, onAction }) {
    const modalRef = useRef(null);

    // Debugging logic
    useEffect(() => {
        if (isOpen && invoice) {
            console.log('ViewInvoiceModal Mounted with Invoice:', invoice);
        }
    }, [isOpen, invoice]);

    if (!isOpen || !invoice) return null;

    // Format helpers with extreme safety
    const formatCurrency = (val) => {
        try {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(Number(val) || 0);
        } catch (e) {
            return '$0.00';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Invalid Date';
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            return 'N/A';
        }
    };

    const handleApprove = async () => {
        try {
            await api.patch(`/invoices/${invoice.id}/approve`);
            onAction && onAction();
            onClose();
        } catch (error) {
            console.error('Failed to approve invoice:', error);
        }
    };

    const handleReject = async () => {
        const reason = prompt('Please provide a reason for rejection:');
        if (!reason) return;

        try {
            await api.patch(`/invoices/${invoice.id}/reject`, { reason });
            onAction && onAction();
            onClose();
        } catch (error) {
            console.error('Failed to reject invoice:', error);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const statusConfig = {
        approved: { label: 'Paid & Settled', variant: 'success', icon: CheckCircle },
        rejected: { label: 'Payment Disputed', variant: 'error', icon: XCircle },
        pending_approval: { label: 'Awaiting Clearance', variant: 'warning', icon: Clock },
    };

    const currentStatus = statusConfig[invoice.status] || {
        label: invoice.status || 'Status Unknown',
        variant: 'slate',
        icon: FileText
    };

    // Extract icon component safely
    const StatusIcon = currentStatus.icon || FileText;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:relative print:z-0">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl transition-all duration-500 print:hidden"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div
                ref={modalRef}
                className="relative w-full max-w-4xl bg-white rounded-[32px] border border-white/50 shadow-2xl shadow-slate-900/20 overflow-hidden animate-in fade-in zoom-in slide-in-from-bottom-4 duration-500 flex flex-col max-h-[95vh] print:shadow-none print:border-none print:max-w-none print:h-auto print:max-h-none print:rounded-none"
            >

                {/* Header - Hidden in Print */}
                <div className="p-8 pb-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center print:hidden">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-200">
                            <FileText className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">Invoice Document</h2>
                                <span className={`status-pill status-pill-${currentStatus.variant}`}>
                                    <StatusIcon className="w-3 h-3 mr-1.5" />
                                    {currentStatus.label}
                                </span>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none">Reference: {invoice.invoice_number || 'TBD'}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all active:scale-90 shadow-sm border border-slate-100"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-10 print:p-0 print:overflow-visible custom-scrollbar">
                    <div className="space-y-12">

                        {/* Action Banner for Buyer */}
                        {userRole === 'buyer' && invoice.status === 'pending_approval' && (
                            <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 flex items-start gap-4 animate-in slide-in-from-top-4 duration-500 print:hidden">
                                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shrink-0 shadow-lg shadow-amber-200">
                                    <AlertCircle className="w-5 h-5 text-white animate-pulse" />
                                </div>
                                <div className="pt-0.5">
                                    <h4 className="text-sm font-black text-amber-900 uppercase tracking-tight mb-1">Clearance Required</h4>
                                    <p className="text-xs text-amber-700 font-medium leading-relaxed">
                                        Supplier has submitted this invoice for settlement. Please verify all line items and approve to initiate fund transfer.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Top Metadata */}
                        <div className="flex flex-col md:flex-row justify-between items-start gap-12 border-b border-slate-50 pb-12 print:border-slate-200">
                            <div className="space-y-6 max-w-sm">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Issued By</p>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-1">TechForge Industries</h3>
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-slate-500 flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> High-Tech Zone, Shenzhen, CN</p>
                                        <p className="text-sm font-bold text-slate-400 flex items-center gap-2"><Globe className="w-3.5 h-3.5" /> techforge.global</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Bill To</p>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1">ACME Manufacturing Corp</h3>
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-slate-500 flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> 123 Industrial Way, Detroit, MI, USA</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-x-12 gap-y-6 bg-slate-50/50 p-8 rounded-[32px] border border-slate-100 min-w-[320px] print:bg-white print:border-slate-200">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Issue Date</p>
                                    <p className="text-sm font-black text-slate-900">{formatDate(invoice.issue_date)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Date</p>
                                    <p className="text-sm font-black text-rose-600">{formatDate(invoice.due_date)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PO Reference</p>
                                    <p className="text-sm font-mono font-bold text-slate-900">#{invoice.order_id || '---'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Terms</p>
                                    <p className="text-sm font-black text-slate-900">Net 30 Days</p>
                                </div>
                            </div>
                        </div>

                        {/* Line Items Table */}
                        <div className="rounded-[24px] border border-slate-100 overflow-hidden shadow-sm">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/80 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] print:bg-slate-100">
                                    <tr>
                                        <th className="px-8 py-5">Item Description</th>
                                        <th className="px-8 py-5 text-right">Qty</th>
                                        <th className="px-8 py-5 text-right">Unit Price</th>
                                        <th className="px-8 py-5 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 print:divide-slate-200">
                                    <tr className="group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 print:hidden">
                                                    <Package className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 tracking-tight">Supply Fulfillment Batch</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Order Ref: {invoice.order_id || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right font-mono font-bold text-slate-600">1</td>
                                        <td className="px-8 py-6 text-right font-mono font-bold text-slate-600">{formatCurrency(invoice.subtotal)}</td>
                                        <td className="px-8 py-6 text-right font-mono font-black text-slate-900">{formatCurrency(invoice.subtotal)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Totals Section */}
                        <div className="flex flex-col md:flex-row justify-end gap-12 pt-4">
                            <div className="w-full md:w-96 space-y-4">
                                <div className="flex justify-between items-center text-sm px-2">
                                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Net Subtotal</span>
                                    <span className="font-mono font-bold text-slate-900">{formatCurrency(invoice.subtotal)}</span>
                                </div>

                                <div className="flex justify-between items-center text-sm px-2">
                                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Tax Allocation ({(Number(invoice.tax_rate) * 100).toFixed(0)}%)</span>
                                    <span className="font-mono font-bold text-slate-900">{formatCurrency(invoice.tax_amount)}</span>
                                </div>

                                <div className="flex justify-between items-center text-sm px-2">
                                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Logistics Adjustment</span>
                                    <span className="font-mono font-bold text-slate-900">{formatCurrency(invoice.shipping_cost)}</span>
                                </div>

                                <div className="pt-6 border-t border-slate-100 flex justify-between items-center bg-slate-900 p-8 rounded-[32px] shadow-2xl shadow-slate-900/10 print:bg-white print:border-slate-300 print:shadow-none">
                                    <span className="text-base font-black text-white tracking-tight uppercase print:text-slate-900">Grand Total</span>
                                    <span className="text-3xl font-black text-white font-mono tracking-tighter print:text-slate-900">{formatCurrency(invoice.total_amount)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="hidden print:block pt-12 border-t border-slate-200 text-center">
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Thank you for your business. Aegis Nexus AI-Validated Settlement.</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-slate-50 bg-white flex justify-between items-center print:hidden">
                    <button
                        onClick={handlePrint}
                        className="px-8 py-4 rounded-xl border border-slate-200 text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center gap-3 active:scale-95"
                    >
                        <Printer className="w-4 h-4" />
                        Print Record
                    </button>

                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="px-8 py-4 rounded-xl text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-95"
                        >
                            Close
                        </button>

                        {userRole === 'buyer' && invoice.status === 'pending_approval' && (
                            <>
                                <button
                                    onClick={handleReject}
                                    className="px-8 py-4 bg-white text-rose-600 border border-rose-200 rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:bg-rose-50 hover:border-rose-300 active:scale-95 flex items-center gap-2"
                                >
                                    <XCircle className="w-4 h-4" />
                                    Reject
                                </button>
                                <button
                                    onClick={handleApprove}
                                    className="px-12 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-200 transition-all hover:bg-emerald-700 hover:-translate-y-1 active:scale-95 flex items-center gap-3"
                                >
                                    <CheckCircle className="w-5 h-5" />
                                    Approve & Settle
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
