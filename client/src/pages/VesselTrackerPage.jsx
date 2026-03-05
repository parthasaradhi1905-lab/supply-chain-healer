import ControlTowerLayout from '../components/layout/ControlTowerLayout';
import { Navigation, Ship, Anchor, MapPin, Clock } from 'lucide-react';

export default function VesselTrackerPage() {
    const vessels = [
        { id: 'VSL-001', name: 'MV Pacific Star', route: 'Shanghai → Los Angeles', status: 'in_transit', progress: 65, eta: '2026-03-12', cargo: 'Electronics', flag: '🇨🇳' },
        { id: 'VSL-002', name: 'SS Atlantic Wave', route: 'Rotterdam → New York', status: 'in_transit', progress: 42, eta: '2026-03-18', cargo: 'Auto Parts', flag: '🇳🇱' },
        { id: 'VSL-003', name: 'MV Indian Ocean', route: 'Mumbai → Dubai', status: 'docked', progress: 100, eta: '2026-03-04', cargo: 'Textiles', flag: '🇮🇳' },
        { id: 'VSL-004', name: 'SS Nordic Frost', route: 'Hamburg → Singapore', status: 'in_transit', progress: 28, eta: '2026-03-25', cargo: 'Machinery', flag: '🇩🇪' },
        { id: 'VSL-005', name: 'MV Southern Cross', route: 'Sydney → Tokyo', status: 'loading', progress: 10, eta: '2026-04-02', cargo: 'Raw Materials', flag: '🇦🇺' },
    ];

    const getStatusStyle = (status) => {
        switch (status) {
            case 'in_transit': return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'docked': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
            case 'loading': return 'bg-amber-50 text-amber-600 border-amber-200';
            default: return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    };

    return (
        <ControlTowerLayout>
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                                <Navigation className="w-6 h-6 text-blue-600" />
                            </div>
                            Shipment Tracker
                        </h1>
                        <p className="text-sm text-slate-500 mt-2 ml-15">Track cargo vessels across global shipping lanes</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 text-[11px] font-bold uppercase tracking-widest border border-blue-100">
                            {vessels.filter(v => v.status === 'in_transit').length} In Transit
                        </span>
                        <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 text-[11px] font-bold uppercase tracking-widest border border-emerald-100">
                            {vessels.filter(v => v.status === 'docked').length} Docked
                        </span>
                    </div>
                </div>

                <div className="space-y-4">
                    {vessels.map((vessel) => (
                        <div key={vessel.id} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all group">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl">
                                        {vessel.flag}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{vessel.name}</h3>
                                        <p className="text-sm text-slate-500 flex items-center gap-2">
                                            <Ship className="w-3.5 h-3.5" /> {vessel.route}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-slate-400">{vessel.id}</span>
                                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${getStatusStyle(vessel.status)}`}>
                                        {vessel.status.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>

                            <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
                                <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full transition-all duration-1000"
                                    style={{ width: `${vessel.progress}%` }} />
                                <div className="absolute top-1/2 -translate-y-1/2 transition-all" style={{ left: `${vessel.progress}%` }}>
                                    <Anchor className="w-4 h-4 text-blue-600 -ml-2" />
                                </div>
                            </div>

                            <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-slate-400">
                                <span>{vessel.cargo}</span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> ETA: {new Date(vessel.eta).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </ControlTowerLayout>
    );
}
