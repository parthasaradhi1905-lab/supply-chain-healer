import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ControlTowerLayout from '../components/layout/ControlTowerLayout';
import { User, Mail, Building2, Shield, Camera, Save, Check, Calendar, MapPin, Globe } from 'lucide-react';

export default function ProfilePage() {
    const { user } = useAuth();
    const [editing, setEditing] = useState(false);
    const [saved, setSaved] = useState(false);
    const [form, setForm] = useState({
        username: user?.username || '',
        email: user?.email || '',
        company_name: user?.company_name || '',
        phone: '',
        location: 'United States',
        timezone: 'PST (UTC-8)',
    });

    const handleSave = () => {
        // Update localStorage
        const updatedUser = { ...user, ...form };
        localStorage.setItem('aegis_user', JSON.stringify(updatedUser));
        setEditing(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const getInitials = () => {
        const name = user?.username || 'User';
        return name.split(/[\s_-]+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
    };

    const avatarGradient = user?.role === 'supplier'
        ? 'from-emerald-500 to-teal-600'
        : user?.role === 'admin'
            ? 'from-amber-500 to-orange-600'
            : 'from-blue-500 to-cyan-600';

    const joinDate = new Date(user?.created_at || Date.now()).toLocaleDateString('en-US', {
        month: 'long', year: 'numeric'
    });

    return (
        <ControlTowerLayout>
            <div className="max-w-3xl mx-auto">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Profile</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage your account information and preferences</p>
                </div>

                {/* Profile Card */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Banner */}
                    <div className="h-32 relative" style={{
                        background: user?.role === 'supplier'
                            ? 'linear-gradient(135deg, #059669 0%, #0d9488 100%)'
                            : 'linear-gradient(135deg, #2563eb 0%, #0891b2 100%)'
                    }}>
                        <div className="absolute inset-0 opacity-20" style={{
                            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
                        }} />
                    </div>

                    {/* Avatar + Name */}
                    <div className="px-8 -mt-14 pb-6">
                        <div className="flex items-end gap-5">
                            <div className="relative group">
                                <div className={`w-28 h-28 rounded-3xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white text-3xl font-black shadow-xl border-4 border-white`}>
                                    {getInitials()}
                                </div>
                                <button className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:scale-110 transition-all opacity-0 group-hover:opacity-100">
                                    <Camera className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="pb-1">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{user?.username || 'User'}</h2>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${user?.role === 'supplier' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                                        {user?.role || 'user'}
                                    </span>
                                    <span className="flex items-center gap-1 text-xs text-slate-400">
                                        <Calendar className="w-3 h-3" /> Joined {joinDate}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-slate-100" />

                    {/* Form Fields */}
                    <div className="p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Account Details</h3>
                            {!editing ? (
                                <button onClick={() => setEditing(true)}
                                    className="px-4 py-2 rounded-xl text-sm font-bold text-blue-600 hover:bg-blue-50 transition-colors border border-blue-200">
                                    Edit Profile
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button onClick={() => setEditing(false)}
                                        className="px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors border border-slate-200">
                                        Cancel
                                    </button>
                                    <button onClick={handleSave}
                                        className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm">
                                        <Save className="w-4 h-4" /> Save
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Success toast */}
                        {saved && (
                            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl animate-pulse">
                                <Check className="w-4 h-4 text-emerald-600" />
                                <span className="text-sm font-bold text-emerald-700">Profile updated successfully!</span>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Username */}
                            <div>
                                <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                                    <User className="w-3.5 h-3.5" /> Username
                                </label>
                                <input
                                    type="text" value={form.username}
                                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                                    disabled={!editing}
                                    className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${editing ? 'bg-white border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 text-slate-900' : 'bg-slate-50 border-slate-100 text-slate-600'}`}
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                                    <Mail className="w-3.5 h-3.5" /> Email
                                </label>
                                <input
                                    type="email" value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    disabled={!editing}
                                    className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${editing ? 'bg-white border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 text-slate-900' : 'bg-slate-50 border-slate-100 text-slate-600'}`}
                                />
                            </div>

                            {/* Company */}
                            <div>
                                <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                                    <Building2 className="w-3.5 h-3.5" /> Company
                                </label>
                                <input
                                    type="text" value={form.company_name}
                                    onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                                    disabled={!editing}
                                    className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${editing ? 'bg-white border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 text-slate-900' : 'bg-slate-50 border-slate-100 text-slate-600'}`}
                                />
                            </div>

                            {/* Role */}
                            <div>
                                <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                                    <Shield className="w-3.5 h-3.5" /> Role
                                </label>
                                <input
                                    type="text" value={(user?.role || 'user').toUpperCase()}
                                    disabled
                                    className="w-full px-4 py-3 rounded-xl border bg-slate-50 border-slate-100 text-slate-600 text-sm font-semibold"
                                />
                            </div>

                            {/* Location */}
                            <div>
                                <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                                    <MapPin className="w-3.5 h-3.5" /> Location
                                </label>
                                <input
                                    type="text" value={form.location}
                                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                                    disabled={!editing}
                                    className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${editing ? 'bg-white border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 text-slate-900' : 'bg-slate-50 border-slate-100 text-slate-600'}`}
                                />
                            </div>

                            {/* Timezone */}
                            <div>
                                <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                                    <Globe className="w-3.5 h-3.5" /> Timezone
                                </label>
                                <input
                                    type="text" value={form.timezone}
                                    onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                                    disabled={!editing}
                                    className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${editing ? 'bg-white border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 text-slate-900' : 'bg-slate-50 border-slate-100 text-slate-600'}`}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Activity Summary Card */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 mt-6">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-5">Account Activity</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Orders', value: '7', color: 'text-blue-600 bg-blue-50' },
                            { label: 'Shipments', value: '7', color: 'text-emerald-600 bg-emerald-50' },
                            { label: 'Alerts', value: '2', color: 'text-rose-600 bg-rose-50' },
                            { label: 'Invoices', value: '5', color: 'text-amber-600 bg-amber-50' },
                        ].map((stat, i) => (
                            <div key={i} className="p-4 rounded-2xl border border-slate-100 text-center">
                                <div className={`text-2xl font-black ${stat.color.split(' ')[0]}`}>{stat.value}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </ControlTowerLayout>
    );
}
