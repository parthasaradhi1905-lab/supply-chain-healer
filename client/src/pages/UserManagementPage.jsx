import { useState } from 'react';
import ControlTowerLayout from '../components/layout/ControlTowerLayout';
import { Users, Shield, Mail, Calendar, MoreHorizontal, Search, Plus, Check, X } from 'lucide-react';

export default function UserManagementPage() {
    const [search, setSearch] = useState('');

    const users = [
        { id: 1, name: 'Partha Saradhi', email: 'partha@aegisnexus.com', role: 'Admin', status: 'active', lastLogin: '2026-03-04T06:30:00', department: 'Operations' },
        { id: 2, name: 'Acme Buyer', email: 'buyer@acme.com', role: 'Buyer', status: 'active', lastLogin: '2026-03-04T05:15:00', department: 'Procurement' },
        { id: 3, name: 'Global Supply Co', email: 'supplier@globalsupply.com', role: 'Supplier', status: 'active', lastLogin: '2026-03-03T18:45:00', department: 'Fulfillment' },
        { id: 4, name: 'Sarah Chen', email: 'sarah.chen@aegisnexus.com', role: 'Buyer', status: 'active', lastLogin: '2026-03-02T14:20:00', department: 'Procurement' },
        { id: 5, name: 'James Wilson', email: 'james.w@aegisnexus.com', role: 'Viewer', status: 'inactive', lastLogin: '2026-02-28T10:00:00', department: 'Analytics' },
        { id: 6, name: 'Tokyo Electronics', email: 'contact@tokyoelec.jp', role: 'Supplier', status: 'active', lastLogin: '2026-03-01T22:30:00', department: 'Manufacturing' },
    ];

    const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

    const getRoleStyle = (role) => {
        switch (role) {
            case 'Admin': return 'bg-amber-50 text-amber-600 border-amber-200';
            case 'Buyer': return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'Supplier': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
            default: return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    };

    const getInitials = (name) => name.split(/[\s_-]+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);

    return (
        <ControlTowerLayout>
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                                <Users className="w-6 h-6 text-slate-600" />
                            </div>
                            User Management
                        </h1>
                        <p className="text-sm text-slate-500 mt-2">{users.length} team members across your organization</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search users..." className="pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm w-56 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all" />
                        </div>
                        <button className="px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm">
                            <Plus className="w-4 h-4" /> Add User
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                {['User', 'Role', 'Department', 'Status', 'Last Active', ''].map(h => (
                                    <th key={h} className="text-left px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filtered.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white text-sm font-black">
                                                {getInitials(user.name)}
                                            </div>
                                            <div>
                                                <p className="text-[14px] font-bold text-slate-900">{user.name}</p>
                                                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                                                    <Mail className="w-3 h-3" /> {user.email}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${getRoleStyle(user.role)}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-[13px] font-bold text-slate-600">{user.department}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                            <span className={`text-[12px] font-bold ${user.status === 'active' ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                {user.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[12px] font-bold text-slate-400 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(user.lastLogin).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-slate-100 rounded-xl">
                                            <MoreHorizontal className="w-4 h-4 text-slate-400" />
                                        </button>
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
