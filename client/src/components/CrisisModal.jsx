import { useState } from 'react';
import { X, AlertTriangle, CheckCircle, Clock, DollarSign, Zap, TrendingUp, TrendingDown, RefreshCw, Calendar, MapPin, ShoppingCart, Activity, Globe } from 'lucide-react';

/**
 * Crisis Modal - Full-screen recovery plan comparison
 * Refined for Premium Light Theme
 */
export default function CrisisModal({ disruption, plans, onClose, onAccept, onReject }) {
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectOptions, setShowRejectOptions] = useState(false);

    if (!disruption || !plans || plans.length < 1) return null;

    // Get the latest plan (could be B, C, D, etc. after rejections)
    const failedPlan = plans.find(p => p.status === 'rejected' || p.plan_label === 'Plan A') || plans[0];
    const recoveryPlan = plans.filter(p => p.status !== 'rejected').pop() || plans[plans.length - 1];

    // Calculate deltas
    const costDelta = recoveryPlan.total_cost - (failedPlan.total_cost || recoveryPlan.total_cost);
    const costDeltaPercent = recoveryPlan.cost_increase_percent || 0;
    const timeDelta = (recoveryPlan.new_lead_time_days || 0) - (failedPlan.new_lead_time_days || 0);

    const handleReject = (reason) => {
        onReject(recoveryPlan.id, reason);
        setShowRejectOptions(false);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10 overflow-y-auto">
            {/* Backdrop with sophisticated blur */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl transition-all duration-500"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-5xl bg-white/90 backdrop-blur-2xl rounded-[32px] border border-white/50 shadow-2xl shadow-slate-900/20 overflow-hidden animate-in fade-in zoom-in slide-in-from-bottom-8 duration-500">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all z-20 active:scale-90"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header Section */}
                <div className="relative p-8 pb-0 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center border border-rose-100 shadow-sm shadow-rose-50 relative">
                            <AlertTriangle className="w-8 h-8 text-rose-600 animate-pulse" />
                            <div className="absolute inset-0 rounded-2xl bg-rose-500/10 animate-ping duration-[3000ms]" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-[0.2em] border border-rose-200">Critical Alert</span>
                                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-widest">
                                    <Clock className="w-3 h-3" /> Event Detected
                                </span>
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Supply Chain Disruption</h2>
                            <p className="text-slate-500 text-sm font-medium mt-1">
                                {disruption.title || 'Generic Disruption'} • <span className="text-rose-600 font-bold uppercase">{disruption.severity || 'HIGH'} SEVERITY</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 px-5 py-3 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm shadow-emerald-50 self-start md:self-auto">
                        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200">
                            <Zap className="w-4 h-4 text-white animate-bounce duration-[2000ms]" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest leading-none mb-0.5">AI Engine</p>
                            <p className="text-xs font-black text-emerald-600 uppercase tracking-wider">Recovery active</p>
                        </div>
                    </div>
                </div>

                {/* Comparison Grid */}
                <div className="p-8 pt-10">
                    <div className="grid lg:grid-cols-2 gap-8 mb-8">
                        {/* ─── FAILED PLAN (Left) ─── */}
                        <div className="relative p-8 bg-slate-50/50 rounded-[28px] border border-slate-100 border-dashed group/failed overflow-hidden">
                            {/* Strikethrough Decoration */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                                <X className="w-64 h-64 text-rose-900 rotate-12" />
                            </div>

                            <div className="relative">
                                <div className="flex justify-between items-center mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                                            <ShoppingCart className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-lg font-black text-slate-900 tracking-tight">Current Plan</h3>
                                    </div>
                                    <span className="px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-rose-100">Blocked</span>
                                </div>

                                <div className="space-y-6 opacity-60 grayscale-[0.5]">
                                    <PlanDetail label="Primary Source" value={failedPlan.supplier_name || 'N/A'} icon={Globe} />
                                    <PlanDetail label="Origination" value={failedPlan.supplier_location || 'N/A'} icon={MapPin} />
                                    <div className="grid grid-cols-2 gap-6">
                                        <PlanDetail label="Unit Cost" value={`$${failedPlan.total_cost?.toLocaleString() || '—'}`} mono icon={DollarSign} />
                                        <PlanDetail label="Lead Time" value={`${failedPlan.new_lead_time_days || '—'} Days`} mono icon={Calendar} />
                                    </div>
                                </div>

                                <div className="mt-8 p-4 bg-rose-50/30 rounded-2xl border border-rose-100/30">
                                    <p className="text-xs font-bold text-rose-600 leading-relaxed uppercase tracking-wide">
                                        Reason: {failedPlan.ai_reasoning || 'Supplier offline due to disruption event.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ─── RECOVERY PLAN (Right) ─── */}
                        <div className="relative p-8 bg-white rounded-[28px] border border-emerald-100 shadow-2xl shadow-emerald-500/10 group/recovery overflow-hidden">
                            {/* Glow Decoration */}
                            <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full opacity-60 group-hover/recovery:opacity-100 transition-opacity" />

                            <div className="relative">
                                <div className="flex justify-between items-center mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                                            <CheckCircle className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900 tracking-tight">AI Recovery Plan</h3>
                                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest leading-none">Optimal Path</p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-emerald-100">Recommended</span>
                                </div>

                                <div className="space-y-6">
                                    <PlanDetail label="Alternate Source" value={recoveryPlan.supplier_name} highlight icon={Globe} />
                                    <PlanDetail label="Route" value={recoveryPlan.supplier_location} icon={MapPin} />
                                    <div className="grid grid-cols-2 gap-6">
                                        <PlanDetail
                                            label="Adjustment"
                                            value={`$${recoveryPlan.total_cost?.toLocaleString()}`}
                                            mono
                                            highlight
                                            icon={DollarSign}
                                            delta={costDeltaPercent !== 0 ? `${costDeltaPercent > 0 ? '+' : ''}${costDeltaPercent}%` : null}
                                            deltaPositive={costDeltaPercent <= 0}
                                        />
                                        <PlanDetail
                                            label="Lead Time"
                                            value={`${recoveryPlan.new_lead_time_days} Days`}
                                            mono
                                            highlight
                                            icon={Calendar}
                                            delta={timeDelta !== 0 ? `${timeDelta > 0 ? '+' : ''}${timeDelta}d` : null}
                                            deltaPositive={timeDelta <= 0}
                                        />
                                    </div>
                                    <PlanDetail
                                        label="Fulfillment Match"
                                        value={`${recoveryPlan.quantity?.toLocaleString()} units (100%)`}
                                        highlight
                                        icon={Activity}
                                    />
                                </div>

                                <div className="mt-8 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm shadow-emerald-50">
                                    <p className="text-xs font-bold text-emerald-700 leading-relaxed uppercase tracking-wide">
                                        Decision: {recoveryPlan.ai_reasoning || 'Optimized for stock continuity and 100% quantity compliance.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex flex-col items-center gap-6 pt-4 border-t border-slate-50">
                        <div className="flex flex-wrap gap-4 justify-center w-full">
                            <button
                                onClick={() => onAccept(recoveryPlan)}
                                className="group/btn relative px-10 py-4 bg-emerald-600 text-white rounded-[20px] font-black text-sm uppercase tracking-[0.1em] shadow-xl shadow-emerald-200 transition-all hover:bg-emerald-700 hover:-translate-y-1 active:scale-95 overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 group-hover/btn:scale-125 transition-transform" />
                                    Deploy Recovery Plan
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/0 via-white/10 to-emerald-400/0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                            </button>

                            {!showRejectOptions ? (
                                <button
                                    onClick={() => setShowRejectOptions(true)}
                                    className="px-8 py-4 bg-slate-50 text-slate-500 border border-slate-200 rounded-[20px] font-bold text-sm uppercase tracking-widest transition-all hover:bg-white hover:text-slate-900 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/50 active:scale-95 flex items-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Explore Alternatives
                                </button>
                            ) : (
                                <div className="flex flex-wrap gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
                                    <button
                                        onClick={() => handleReject('too_expensive')}
                                        className="px-6 py-4 bg-rose-50 text-rose-600 border border-rose-200 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all active:scale-95 flex items-center gap-2"
                                    >
                                        <DollarSign className="w-4 h-4" /> Too Expensive
                                    </button>
                                    <button
                                        onClick={() => handleReject('too_slow')}
                                        className="px-6 py-4 bg-rose-50 text-rose-600 border border-rose-200 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all active:scale-95 flex items-center gap-2"
                                    >
                                        <Clock className="w-4 h-4" /> Too Slow
                                    </button>
                                    <button
                                        onClick={() => setShowRejectOptions(false)}
                                        className="px-6 py-4 bg-white text-slate-400 border border-slate-200 rounded-2xl font-bold text-[11px] uppercase tracking-widest hover:text-slate-900 transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Validated by Aegis Nexus AI Engine v4.0.2</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Sub-component: Plan Detail Row
function PlanDetail({ label, value, mono, highlight, delta, deltaPositive, icon: Icon }) {
    return (
        <div className="group/detail">
            <div className="flex items-center gap-2 mb-1.5">
                <Icon className={`w-3 h-3 ${highlight ? 'text-emerald-500' : 'text-slate-400'} group-hover/detail:scale-110 transition-transform`} />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
            </div>
            <div className="flex items-baseline gap-2 pl-5">
                <p className={`text-sm ${highlight ? 'text-slate-900 font-black' : 'text-slate-600 font-bold'} ${mono ? 'font-mono' : ''} tracking-tight`}>
                    {value || '—'}
                </p>
                {delta && (
                    <span className={`px-1.5 py-0.5 rounded-lg text-[10px] font-black font-mono flex items-center gap-0.5 shadow-sm ${deltaPositive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                        }`}>
                        {deltaPositive ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                        {delta}
                    </span>
                )}
            </div>
        </div>
    );
}
