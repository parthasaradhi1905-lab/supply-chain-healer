import ControlTowerLayout from '../components/layout/ControlTowerLayout';
import { Flag, TrendingUp, TrendingDown, Globe, Users, Factory, Ship, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function CountryDataPage() {
    const countries = [
        { name: 'China', flag: '🇨🇳', gdpGrowth: 5.2, exports: '3.38T', imports: '2.56T', tradeBalance: '+$822B', riskLevel: 'medium', suppliers: 42, routes: 18 },
        { name: 'United States', flag: '🇺🇸', gdpGrowth: 2.5, exports: '2.08T', imports: '3.12T', tradeBalance: '-$1.04T', riskLevel: 'low', suppliers: 35, routes: 24 },
        { name: 'Germany', flag: '🇩🇪', gdpGrowth: 0.3, exports: '1.80T', imports: '1.38T', tradeBalance: '+$420B', riskLevel: 'low', suppliers: 28, routes: 15 },
        { name: 'Japan', flag: '🇯🇵', gdpGrowth: 1.9, exports: '756B', imports: '897B', tradeBalance: '-$141B', riskLevel: 'low', suppliers: 22, routes: 12 },
        { name: 'India', flag: '🇮🇳', gdpGrowth: 7.8, exports: '451B', imports: '725B', tradeBalance: '-$274B', riskLevel: 'medium', suppliers: 18, routes: 10 },
        { name: 'South Korea', flag: '🇰🇷', gdpGrowth: 2.6, exports: '644B', imports: '632B', tradeBalance: '+$12B', riskLevel: 'low', suppliers: 15, routes: 8 },
        { name: 'Brazil', flag: '🇧🇷', gdpGrowth: 2.9, exports: '340B', imports: '273B', tradeBalance: '+$67B', riskLevel: 'medium', suppliers: 8, routes: 5 },
        { name: 'Vietnam', flag: '🇻🇳', gdpGrowth: 6.5, exports: '355B', imports: '327B', tradeBalance: '+$28B', riskLevel: 'medium', suppliers: 12, routes: 6 },
    ];

    const getRiskStyle = (level) => {
        switch (level) {
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
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center">
                            <Flag className="w-6 h-6 text-rose-600" />
                        </div>
                        Country Data
                    </h1>
                    <p className="text-sm text-slate-500 mt-2">Trade intelligence, risk profiles, and supplier distribution by country</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Countries Tracked', value: countries.length, icon: Globe },
                        { label: 'Total Suppliers', value: countries.reduce((s, c) => s + c.suppliers, 0), icon: Factory },
                        { label: 'Active Routes', value: countries.reduce((s, c) => s + c.routes, 0), icon: Ship },
                        { label: 'Avg GDP Growth', value: `${(countries.reduce((s, c) => s + c.gdpGrowth, 0) / countries.length).toFixed(1)}%`, icon: TrendingUp },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5">
                            <div className="flex items-center gap-3 mb-2">
                                <stat.icon className="w-4 h-4 text-slate-400" />
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</span>
                            </div>
                            <span className="text-2xl font-black text-slate-900">{stat.value}</span>
                        </div>
                    ))}
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                {['Country', 'GDP Growth', 'Exports', 'Trade Balance', 'Suppliers', 'Routes', 'Risk'].map(h => (
                                    <th key={h} className="text-left px-5 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {countries.map((c) => (
                                <tr key={c.name} className="hover:bg-slate-50/80 transition-colors cursor-pointer group">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">{c.flag}</span>
                                            <span className="text-[14px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{c.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className={`flex items-center gap-1 text-[13px] font-bold ${c.gdpGrowth >= 3 ? 'text-emerald-600' : 'text-slate-600'}`}>
                                            {c.gdpGrowth >= 3 ? <ArrowUpRight className="w-3.5 h-3.5" /> : null}
                                            {c.gdpGrowth}%
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-[13px] font-bold text-slate-700 font-mono">${c.exports}</td>
                                    <td className="px-5 py-4">
                                        <span className={`text-[13px] font-bold font-mono ${c.tradeBalance.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {c.tradeBalance}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-[13px] font-bold text-slate-700">{c.suppliers}</td>
                                    <td className="px-5 py-4 text-[13px] font-bold text-slate-700">{c.routes}</td>
                                    <td className="px-5 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${getRiskStyle(c.riskLevel)}`}>
                                            {c.riskLevel}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </ControlTowerLayout>
    );
}
