import ControlTowerLayout from '../components/layout/ControlTowerLayout';
import { useSettings } from '../context/SettingsContext';
import { RefreshCw, Package, AlertTriangle, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function StockToolPage() {
    const { formatCurrency } = useSettings();

    const inventory = [
        { name: 'Electronic Components', sku: 'EC-4420', quantity: 12500, reorderLevel: 5000, unitCost: 24.50, status: 'healthy', daysLeft: 45 },
        { name: 'Steel Sheets (Grade A)', sku: 'SS-1001', quantity: 3200, reorderLevel: 4000, unitCost: 180.00, status: 'low', daysLeft: 12 },
        { name: 'Lithium Batteries', sku: 'LB-2210', quantity: 8900, reorderLevel: 3000, unitCost: 45.00, status: 'healthy', daysLeft: 60 },
        { name: 'Copper Wiring (100m)', sku: 'CW-3305', quantity: 1500, reorderLevel: 2000, unitCost: 120.00, status: 'critical', daysLeft: 5 },
        { name: 'Plastic Resin Pellets', sku: 'PR-5500', quantity: 45000, reorderLevel: 10000, unitCost: 3.20, status: 'healthy', daysLeft: 90 },
        { name: 'Glass Panels (Tempered)', sku: 'GP-7720', quantity: 2800, reorderLevel: 2500, unitCost: 85.00, status: 'low', daysLeft: 15 },
        { name: 'Rubber Seals', sku: 'RS-9900', quantity: 22000, reorderLevel: 5000, unitCost: 1.50, status: 'healthy', daysLeft: 75 },
    ];

    const getStatusStyle = (status) => {
        switch (status) {
            case 'healthy': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
            case 'low': return 'bg-amber-50 text-amber-600 border-amber-200';
            case 'critical': return 'bg-rose-50 text-rose-600 border-rose-200';
            default: return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    };

    return (
        <ControlTowerLayout>
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center">
                                <RefreshCw className="w-6 h-6 text-cyan-600" />
                            </div>
                            Stock Tool
                        </h1>
                        <p className="text-sm text-slate-500 mt-2">Inventory levels, reorder triggers, and stock analytics</p>
                    </div>
                    <div className="flex gap-2">
                        {['healthy', 'low', 'critical'].map(status => (
                            <span key={status} className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-widest border ${getStatusStyle(status)}`}>
                                {inventory.filter(i => i.status === status).length} {status}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                {['Material', 'SKU', 'In Stock', 'Reorder Level', 'Unit Cost', 'Stock Value', 'Days Left', 'Status'].map(h => (
                                    <th key={h} className="text-left px-5 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {inventory.map((item) => (
                                <tr key={item.sku} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-5 py-4">
                                        <span className="text-[13px] font-bold text-slate-900">{item.name}</span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="text-[12px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{item.sku}</span>
                                    </td>
                                    <td className="px-5 py-4 text-[13px] font-bold text-slate-700 font-mono">{item.quantity.toLocaleString()}</td>
                                    <td className="px-5 py-4 text-[13px] font-bold text-slate-400 font-mono">{item.reorderLevel.toLocaleString()}</td>
                                    <td className="px-5 py-4 text-[13px] font-bold text-slate-700 font-mono">{formatCurrency(item.unitCost)}</td>
                                    <td className="px-5 py-4 text-[13px] font-black text-emerald-600 font-mono">{formatCurrency(item.quantity * item.unitCost)}</td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${item.daysLeft > 30 ? 'bg-emerald-500' : item.daysLeft > 10 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                    style={{ width: `${Math.min(100, (item.daysLeft / 90) * 100)}%` }} />
                                            </div>
                                            <span className="text-[12px] font-bold text-slate-600">{item.daysLeft}d</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${getStatusStyle(item.status)}`}>
                                            {item.status === 'critical' && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                                            {item.status}
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
