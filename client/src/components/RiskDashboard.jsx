import { useEffect, useState } from "react";
import { Activity, Zap, Clock, ShieldCheck } from 'lucide-react';

export default function RiskDashboard() {
    const [risk, setRisk] = useState(null);

    useEffect(() => {
        const ws = new WebSocket("ws://localhost:8080");

        ws.onmessage = (event) => {
            try {
                const parsed = JSON.parse(event.data);
                if (parsed.type === "stream:risk.predictions") {
                    setRisk(parsed.payload);
                } else if (!parsed.type) { // Fallback for old mock scripts
                    setRisk(parsed);
                }
            } catch (err) {
                console.error("Failed to parse websocket message", err);
            }
        };

        return () => ws.close();
    }, []);

    return (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-6">
                <Activity className="text-blue-500" />
                Live Risk Prediction Monitor
            </h2>

            {risk ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-rose-50/50 border border-rose-100 p-4 rounded-xl flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center">
                            <Zap className="text-rose-600 w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-rose-400 uppercase tracking-widest">Risk Score</p>
                            <p className="text-2xl font-extrabold text-rose-600">{(risk.risk_score || risk.riskScore || 0).toFixed(2)}</p>
                        </div>
                    </div>

                    <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-xl flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                            <Clock className="text-amber-600 w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-amber-400 uppercase tracking-widest">Predicted Delay</p>
                            <p className="text-2xl font-extrabold text-amber-600">{risk.delay_days || risk.delayDays || 0} Days</p>
                        </div>
                    </div>

                    <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                            <ShieldCheck className="text-blue-600 w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-blue-400 uppercase tracking-widest">Fragile Nodes</p>
                            <p className="text-2xl font-extrabold text-blue-600">{risk.nodes?.length || risk.affected_nodes?.length || 0}</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="h-32 flex flex-col items-center justify-center text-slate-400 opacity-60">
                    <Zap className="w-8 h-8 mb-2 animate-pulse" />
                    <p className="text-xs font-bold uppercase tracking-widest">Waiting for risk predictions...</p>
                </div>
            )}
        </div>
    );
}
