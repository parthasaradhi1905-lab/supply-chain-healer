import ControlTowerLayout from '../components/layout/ControlTowerLayout';
import { MapPin, Zap, Wind, Droplets, Sun, Factory } from 'lucide-react';

export default function EnergyMapPage() {
    const regions = [
        { name: 'North America', energyCost: 0.12, renewable: 35, sources: ['Solar', 'Wind', 'Natural Gas'], gridStability: 98, hub: 'Houston, TX' },
        { name: 'Western Europe', energyCost: 0.28, renewable: 52, sources: ['Wind', 'Solar', 'Nuclear'], gridStability: 96, hub: 'Amsterdam, NL' },
        { name: 'East Asia', energyCost: 0.18, renewable: 22, sources: ['Coal', 'Nuclear', 'Solar'], gridStability: 94, hub: 'Shanghai, CN' },
        { name: 'South Asia', energyCost: 0.08, renewable: 18, sources: ['Coal', 'Hydro', 'Solar'], gridStability: 82, hub: 'Mumbai, IN' },
        { name: 'Southeast Asia', energyCost: 0.10, renewable: 15, sources: ['Natural Gas', 'Coal', 'Hydro'], gridStability: 78, hub: 'Singapore' },
        { name: 'Middle East', energyCost: 0.04, renewable: 8, sources: ['Natural Gas', 'Oil', 'Solar'], gridStability: 90, hub: 'Dubai, UAE' },
        { name: 'South America', energyCost: 0.09, renewable: 65, sources: ['Hydro', 'Wind', 'Biomass'], gridStability: 75, hub: 'São Paulo, BR' },
        { name: 'Africa', energyCost: 0.14, renewable: 12, sources: ['Solar', 'Hydro', 'Diesel'], gridStability: 60, hub: 'Lagos, NG' },
    ];

    const getSourceIcon = (source) => {
        switch (source) {
            case 'Solar': return <Sun className="w-3 h-3 text-amber-500" />;
            case 'Wind': return <Wind className="w-3 h-3 text-cyan-500" />;
            case 'Hydro': return <Droplets className="w-3 h-3 text-blue-500" />;
            default: return <Factory className="w-3 h-3 text-slate-400" />;
        }
    };

    return (
        <ControlTowerLayout>
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                            <MapPin className="w-6 h-6 text-amber-600" />
                        </div>
                        Energy Map
                    </h1>
                    <p className="text-sm text-slate-500 mt-2">Global energy costs, renewable mix, and grid stability by region</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {regions.map((region) => (
                        <div key={region.name} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all group cursor-pointer">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{region.name}</h3>
                                    <p className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                                        <MapPin className="w-3 h-3" /> {region.hub}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-slate-900 font-mono">${region.energyCost}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">per kWh</p>
                                </div>
                            </div>

                            {/* Renewable Mix Bar */}
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Renewable: {region.renewable}%</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Grid: {region.gridStability}%</span>
                                </div>
                                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-1000"
                                        style={{ width: `${region.renewable}%` }} />
                                </div>
                            </div>

                            {/* Energy Sources */}
                            <div className="flex items-center gap-2">
                                {region.sources.map((source, i) => (
                                    <span key={i} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-500">
                                        {getSourceIcon(source)} {source}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </ControlTowerLayout>
    );
}
