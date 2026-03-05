import ControlTowerLayout from '../components/layout/ControlTowerLayout';
import { useSettings } from '../context/SettingsContext';
import { Shuffle, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';

export default function ArbitrageGridPage() {
    const { formatCurrency } = useSettings();

    const opportunities = [
        { source: 'Shanghai', dest: 'Los Angeles', commodity: 'Steel HRC', buyPrice: 580, sellPrice: 680, spread: 100, spreadPct: 17.2, volume: '500 tons', risk: 'low' },
        { source: 'Mumbai', dest: 'Rotterdam', commodity: 'Aluminum', buyPrice: 2180, sellPrice: 2420, spread: 240, spreadPct: 11.0, volume: '200 tons', risk: 'medium' },
        { source: 'São Paulo', dest: 'Hamburg', commodity: 'Copper', buyPrice: 8600, sellPrice: 9100, spread: 500, spreadPct: 5.8, volume: '100 tons', risk: 'low' },
        { source: 'Tokyo', dest: 'Singapore', commodity: 'Polyethylene', buyPrice: 1050, sellPrice: 1210, spread: 160, spreadPct: 15.2, volume: '300 tons', risk: 'low' },
        { source: 'Seoul', dest: 'Dubai', commodity: 'Lithium', buyPrice: 13200, sellPrice: 15100, spread: 1900, spreadPct: 14.4, volume: '50 tons', risk: 'high' },
        { source: 'Ho Chi Minh', dest: 'New York', commodity: 'Electronics', buyPrice: 420, sellPrice: 580, spread: 160, spreadPct: 38.1, volume: '1000 units', risk: 'medium' },
    ];

    const getRiskStyle = (risk) => {
        switch (risk) {
            case 'low': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
            case 'medium': return 'bg-amber-50 text-amber-600 border-amber-200';
            case 'high': return 'bg-rose-50 text-rose-600 border-rose-200';
            default: return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    };

    return (
        <ControlTowerLayout>
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center">
                            <Shuffle className="w-6 h-6 text-violet-600" />
                        </div>
                        Arbitrage Grid
                    </h1>
                    <p className="text-sm text-slate-500 mt-2">Cross-market price differentials and arbitrage opportunities</p>
                </div>

                <div className="space-y-4">
                    {opportunities.map((opp, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all group cursor-pointer">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{opp.commodity}</h3>
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getRiskStyle(opp.risk)}`}>{opp.risk} risk</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{opp.volume}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                {/* Buy Side */}
                                <div className="flex-1 bg-blue-50/50 rounded-xl p-4 border border-blue-100/50">
                                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Buy @ {opp.source}</p>
                                    <p className="text-xl font-black text-slate-900 font-mono">{formatCurrency(opp.buyPrice)}</p>
                                </div>

                                {/* Arrow */}
                                <div className="flex flex-col items-center gap-1">
                                    <ArrowRight className="w-5 h-5 text-slate-300" />
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                        +{opp.spreadPct}%
                                    </span>
                                </div>

                                {/* Sell Side */}
                                <div className="flex-1 bg-emerald-50/50 rounded-xl p-4 border border-emerald-100/50">
                                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Sell @ {opp.dest}</p>
                                    <p className="text-xl font-black text-slate-900 font-mono">{formatCurrency(opp.sellPrice)}</p>
                                </div>

                                {/* Spread */}
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center min-w-[120px]">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Spread</p>
                                    <p className="text-xl font-black text-emerald-600 font-mono">{formatCurrency(opp.spread)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </ControlTowerLayout>
    );
}
