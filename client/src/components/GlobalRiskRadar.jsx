import { ShieldAlert, TrendingUp, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function GlobalRiskRadar({ radarData = [] }) {

    // Calculates semantic color coding based on fragility percentage
    const getRiskColor = (risk) => {
        if (risk > 0.70) return 'text-accent-danger';
        if (risk > 0.40) return 'text-accent-warning';
        return 'text-accent-success';
    };

    const getRiskBorder = (risk) => {
        if (risk > 0.70) return 'border-accent-danger/30 bg-accent-danger/5';
        if (risk > 0.40) return 'border-accent-warning/30 bg-accent-warning/5';
        return 'border-border-light';
    };

    return (
        <div className="bg-white p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <ShieldAlert className="text-blue-500" />
                    Global Risk Radar
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-widest bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-100 animate-pulse">
                    Live Predictive Tracking
                </span>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                {radarData.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                        <TrendingUp className="w-8 h-8 mb-2" />
                        <p className="text-xs font-bold uppercase tracking-widest">Awaiting Predictive Forecasts...</p>
                    </div>
                ) : (
                    radarData.map((node, i) => (
                        <div key={node.name} className={`p-4 rounded-xl border transition-all ${node.risk > 0.7 ? 'border-rose-100 bg-rose-50/30' :
                                node.risk > 0.4 ? 'border-amber-100 bg-amber-50/30' :
                                    'border-slate-50 bg-slate-50/30'
                            }`}>
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-400 font-mono text-xs font-bold">{i + 1}</span>
                                    <h3 className="font-bold text-slate-900 text-sm">{node.name}</h3>
                                </div>
                                <div className={`font-bold font-mono text-lg ${node.risk > 0.7 ? 'text-rose-600' :
                                        node.risk > 0.4 ? 'text-amber-600' :
                                            'text-emerald-600'
                                    }`}>
                                    {Math.round(node.risk * 100)}%
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[11px] font-bold uppercase tracking-wider">
                                <div className="text-slate-400">
                                    Window: <span className="text-slate-600">{node.window}</span>
                                </div>
                                <div className="text-right text-slate-400 flex items-center justify-end gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    Conf: {Math.round(node.confidence * 100)}%
                                </div>
                            </div>

                            {/* Simple inline progress bar for risk gauge */}
                            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                                <div
                                    className={`h-full ${node.risk > 0.7 ? 'bg-rose-500' :
                                            node.risk > 0.4 ? 'bg-amber-500' :
                                                'bg-emerald-500'
                                        }`}
                                    style={{ width: `${Math.round(node.risk * 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
