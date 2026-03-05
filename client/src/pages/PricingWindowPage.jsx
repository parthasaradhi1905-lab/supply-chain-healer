import { useState } from 'react';
import ControlTowerLayout from '../components/layout/ControlTowerLayout';
import { useSettings } from '../context/SettingsContext';
import { Globe, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Search } from 'lucide-react';

export default function PricingWindowPage() {
    const { formatCurrency } = useSettings();
    const [search, setSearch] = useState('');

    const commodities = [
        { name: 'Crude Oil (Brent)', unit: 'barrel', price: 78.45, change: 2.3, high: 82.10, low: 72.50, volume: '12.4M' },
        { name: 'Natural Gas', unit: 'MMBtu', price: 3.28, change: -1.5, high: 4.10, low: 2.80, volume: '8.7M' },
        { name: 'Steel HRC', unit: 'ton', price: 625.00, change: 0.8, high: 710.00, low: 580.00, volume: '5.2M' },
        { name: 'Aluminum', unit: 'ton', price: 2340.00, change: -0.4, high: 2650.00, low: 2100.00, volume: '3.8M' },
        { name: 'Copper', unit: 'ton', price: 8920.00, change: 1.2, high: 9500.00, low: 8200.00, volume: '6.1M' },
        { name: 'Lithium Carbonate', unit: 'ton', price: 14500.00, change: -3.2, high: 22000.00, low: 12000.00, volume: '1.2M' },
        { name: 'Polyethylene', unit: 'ton', price: 1180.00, change: 0.5, high: 1350.00, low: 1050.00, volume: '2.9M' },
        { name: 'Wheat', unit: 'bushel', price: 5.42, change: -0.8, high: 6.80, low: 4.90, volume: '9.3M' },
    ];

    const filtered = commodities.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <ControlTowerLayout>
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                                <Globe className="w-6 h-6 text-emerald-600" />
                            </div>
                            Pricing Window
                        </h1>
                        <p className="text-sm text-slate-500 mt-2">Global commodity pricing and market intelligence</p>
                    </div>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search commodities..." className="pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm w-64 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all" />
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                {['Commodity', 'Price', 'Change', '52W High', '52W Low', 'Volume'].map(h => (
                                    <th key={h} className="text-left px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filtered.map((item) => (
                                <tr key={item.name} className="hover:bg-slate-50/80 transition-colors group cursor-pointer">
                                    <td className="px-6 py-5">
                                        <span className="text-[14px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{item.name}</span>
                                        <span className="text-[11px] text-slate-400 ml-2">/ {item.unit}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-[15px] font-black text-slate-900 font-mono">{formatCurrency(item.price)}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className={`flex items-center gap-1 text-[13px] font-bold ${item.change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {item.change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                            {Math.abs(item.change)}%
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-[13px] font-bold text-slate-500 font-mono">{formatCurrency(item.high)}</td>
                                    <td className="px-6 py-5 text-[13px] font-bold text-slate-500 font-mono">{formatCurrency(item.low)}</td>
                                    <td className="px-6 py-5 text-[13px] font-bold text-slate-400">{item.volume}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </ControlTowerLayout>
    );
}
