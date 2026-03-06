import api from '../utils/api';
import { Anchor, Zap, AlertTriangle, Wind } from 'lucide-react';

export default function CrisisControlPanel() {
    const triggerCrisis = async (type) => {
        try {
            await api.post("/ai/trigger-crisis", {
                disruptionType: type,
                orderId: 1 // Sending a default order ID as this is a global event generator
            });
            console.log(`[CrisisControl] Triggered ${type} successfully`);
        } catch (err) {
            console.error("Failed to trigger crisis", err);
        }
    };

    return (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="text-amber-500" />
                Global Crisis Control
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                    onClick={() => triggerCrisis("suez_blockage")}
                    className="p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all text-left flex items-start gap-3 group"
                >
                    <Anchor className="text-blue-500 mt-1 transition-transform group-hover:scale-110" />
                    <div>
                        <div className="font-bold text-slate-900 text-sm">Suez Canal Blockage</div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Maritime Disruption</div>
                    </div>
                </button>
                <button
                    onClick={() => triggerCrisis("taiwan_chip_shortage")}
                    className="p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all text-left flex items-start gap-3 group"
                >
                    <Zap className="text-amber-500 mt-1 transition-transform group-hover:scale-110" />
                    <div>
                        <div className="font-bold text-slate-900 text-sm">Taiwan Chip Shortage</div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Supplier Failure</div>
                    </div>
                </button>
                <button
                    onClick={() => triggerCrisis("rotterdam_strike")}
                    className="p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all text-left flex items-start gap-3 group"
                >
                    <AlertTriangle className="text-rose-500 mt-1 transition-transform group-hover:scale-110" />
                    <div>
                        <div className="font-bold text-slate-900 text-sm">Rotterdam Strike</div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Logistics Disruption</div>
                    </div>
                </button>
                <button
                    onClick={() => triggerCrisis("panama_drought")}
                    className="p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all text-left flex items-start gap-3 group"
                >
                    <Wind className="text-indigo-500 mt-1 transition-transform group-hover:scale-110" />
                    <div>
                        <div className="font-bold text-slate-900 text-sm">Panama Drought</div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Natural Disaster</div>
                    </div>
                </button>
            </div>
        </div>
    );
}
