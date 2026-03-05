import { useState, useEffect } from 'react';
import ControlTowerLayout from '../components/layout/ControlTowerLayout';
import { useSettings } from '../context/SettingsContext';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';

export default function LivePricesPage() {
    const { formatCurrency } = useSettings();
    const [prices, setPrices] = useState([
        { id: 1, name: 'Crude Oil WTI', price: 76.82, change: 1.4, sparkline: [72, 74, 73, 76, 75, 76.82] },
        { id: 2, name: 'Brent Crude', price: 78.45, change: 2.1, sparkline: [74, 76, 75, 77, 78, 78.45] },
        { id: 3, name: 'Gold Spot', price: 2048.30, change: -0.3, sparkline: [2060, 2055, 2050, 2045, 2048, 2048.3] },
        { id: 4, name: 'Silver Spot', price: 23.14, change: 0.8, sparkline: [22.5, 22.8, 23.0, 22.9, 23.1, 23.14] },
        { id: 5, name: 'Natural Gas', price: 3.28, change: -1.5, sparkline: [3.4, 3.35, 3.3, 3.32, 3.29, 3.28] },
        { id: 6, name: 'Copper', price: 8920.00, change: 1.2, sparkline: [8800, 8850, 8900, 8880, 8910, 8920] },
        { id: 7, name: 'Aluminum', price: 2340.00, change: -0.4, sparkline: [2360, 2350, 2345, 2348, 2342, 2340] },
        { id: 8, name: 'Steel HRC', price: 625.00, change: 0.8, sparkline: [615, 618, 620, 622, 624, 625] },
    ]);

    // Simulate live price updates
    useEffect(() => {
        const interval = setInterval(() => {
            setPrices(prev => prev.map(p => {
                const fluctuation = (Math.random() - 0.5) * p.price * 0.002;
                const newPrice = +(p.price + fluctuation).toFixed(2);
                const newChange = +((newPrice - p.sparkline[0]) / p.sparkline[0] * 100).toFixed(2);
                return {
                    ...p,
                    price: newPrice,
                    change: newChange,
                    sparkline: [...p.sparkline.slice(1), newPrice],
                };
            }));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <ControlTowerLayout>
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-indigo-600" />
                        </div>
                        Live Prices
                        <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-[11px] font-bold uppercase tracking-widest">
                            <Zap className="w-3 h-3" /> Live
                        </span>
                    </h1>
                    <p className="text-sm text-slate-500 mt-2">Real-time commodity and energy price feeds</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {prices.map((item) => (
                        <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg transition-all group cursor-pointer">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[13px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{item.name}</span>
                                <div className={`flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-lg ${item.change >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                    {item.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                    {Math.abs(item.change)}%
                                </div>
                            </div>
                            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight mb-3">
                                {formatCurrency(item.price)}
                            </div>
                            {/* Mini sparkline */}
                            <div className="flex items-end gap-0.5 h-8">
                                {item.sparkline.map((val, i) => {
                                    const min = Math.min(...item.sparkline);
                                    const max = Math.max(...item.sparkline);
                                    const range = max - min || 1;
                                    const height = 20 + ((val - min) / range) * 80;
                                    return (
                                        <div key={i} className={`flex-1 rounded-sm transition-all duration-500 ${item.change >= 0 ? 'bg-emerald-400' : 'bg-rose-400'} ${i === item.sparkline.length - 1 ? 'opacity-100' : 'opacity-30'}`}
                                            style={{ height: `${height}%` }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </ControlTowerLayout>
    );
}
