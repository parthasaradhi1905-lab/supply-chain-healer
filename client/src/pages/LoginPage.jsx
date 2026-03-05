import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, Truck, Factory, Settings, UserPlus, LogIn, Lock, Eye, EyeOff, ArrowRight, Shield } from 'lucide-react';

export default function LoginPage() {
    const [isRegister, setIsRegister] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('buyer');
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [mounted, setMounted] = useState(false);

    const { login, register } = useAuth();
    const navigate = useNavigate();

    useEffect(() => { setMounted(true); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess(''); setLoading(true);
        try {
            if (isRegister) {
                if (password !== confirmPassword) { setError('Passwords do not match'); setLoading(false); return; }
                if (password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return; }
                const result = await register(username, password, role, companyName, email);
                if (result.success) { setSuccess('Account created! Redirecting...'); setTimeout(() => navigateByRole(role), 1000); }
                else { setError(result.error || 'Registration failed.'); }
            } else {
                const result = await login(username, password, role);
                if (result.success) { navigateByRole(role); }
                else { setError(result.error || 'Invalid credentials.'); }
            }
        } catch { setError(isRegister ? 'Registration failed.' : 'Login failed.'); }
        finally { setLoading(false); }
    };

    const navigateByRole = (r) => {
        if (r === 'buyer') navigate('/buyer-dashboard');
        else if (r === 'supplier') navigate('/supplier-dashboard');
        else navigate('/admin-dashboard');
    };

    const toggleMode = () => { setIsRegister(!isRegister); setError(''); setSuccess(''); setPassword(''); setConfirmPassword(''); };

    const roleConfig = {
        buyer: { icon: Factory, label: 'Buyer', color: '#0891b2' },
        supplier: { icon: Truck, label: 'Supplier', color: '#059669' },
        admin: { icon: Settings, label: 'Admin', color: '#d97706' },
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-sky-100">
            <style>{`
                @keyframes fade-up { 0%{opacity:0;transform:translateY(28px)} 100%{opacity:1;transform:translateY(0)} }
                @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
                @keyframes cloud { 0%{transform:translateX(0)} 100%{transform:translateX(25px)} }
                @keyframes pulse-soft { 0%,100%{opacity:0.8} 50%{opacity:1} }
                @keyframes ken-burns { 0%{transform:scale(1)} 100%{transform:scale(1.05)} }
                .card-glass { background:rgba(255,255,255,0.92); backdrop-filter:blur(16px); border:1px solid rgba(255,255,255,0.7); }
                .input-field {
                    width:100%; padding:13px 16px; background:#f8fafc; border:2px solid #e2e8f0;
                    border-radius:14px; color:#0f172a; font-size:14px; transition:all 0.25s; outline:none;
                }
                .input-field:focus { border-color:#0891b2; box-shadow:0 0 0 3px rgba(8,145,178,0.1); background:#fff; }
                .input-field::placeholder { color:#94a3b8; }
            `}</style>

            {/* ===== FULL BACKGROUND IMAGE ===== */}
            <div className="absolute inset-0">
                <img
                    src="/assets/logistics-hero.jpg"
                    alt="Global Logistics"
                    className="w-full h-full object-cover"
                    style={{ animation: 'ken-burns 30s ease-in-out infinite alternate' }}
                />
                {/* Light overlay for text readability */}
                <div className="absolute inset-0" style={{
                    background: 'linear-gradient(135deg, rgba(186,230,253,0.85) 0%, rgba(186,230,253,0.7) 35%, rgba(186,230,253,0.4) 55%, rgba(186,230,253,0.2) 100%)'
                }} />
                {/* Extra tint on right for form */}
                <div className="absolute top-0 right-0 w-[50%] h-full" style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(240,249,255,0.6) 50%, rgba(240,249,255,0.85) 100%)'
                }} />
            </div>

            {/* ===== FLOATING CLOUDS ===== */}
            {[
                { top: '6%', left: '15%', w: 140, opacity: 0.35, delay: '0s', dur: '9s' },
                { top: '12%', left: '55%', w: 100, opacity: 0.25, delay: '2s', dur: '11s' },
                { top: '3%', left: '70%', w: 120, opacity: 0.3, delay: '4s', dur: '8s' },
                { top: '18%', left: '35%', w: 80, opacity: 0.2, delay: '1s', dur: '10s' },
            ].map((c, i) => (
                <div key={i} className="absolute pointer-events-none z-10" style={{ top: c.top, left: c.left, animation: `cloud ${c.dur} ease-in-out ${c.delay} infinite alternate` }}>
                    <svg width={c.w} height={c.w * 0.35} viewBox="0 0 140 48" opacity={c.opacity}>
                        <ellipse cx="70" cy="28" rx="60" ry="18" fill="white" />
                        <ellipse cx="50" cy="24" rx="35" ry="14" fill="white" />
                        <ellipse cx="95" cy="26" rx="30" ry="12" fill="white" />
                    </svg>
                </div>
            ))}

            {/* ===== TOP NAVBAR ===== */}
            <nav className="relative z-30 flex items-center justify-between px-8 lg:px-14 py-5">
                <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/20">
                        <Shield className="w-5 h-5 text-cyan-400" />
                    </div>
                    <span className="text-xl font-black text-slate-900 tracking-tight">Aegis Nexus</span>
                </div>
                <div className="hidden md:flex items-center gap-8">
                    {['Home', 'About Us', 'Our Services', 'Contact'].map((item) => (
                        <a key={item} href="#" className="text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors">{item}</a>
                    ))}
                </div>
                <button
                    onClick={() => document.getElementById('login-form')?.scrollIntoView({ behavior: 'smooth' })}
                    className="px-6 py-2.5 rounded-full border-2 border-slate-900 text-sm font-bold text-slate-900 hover:bg-slate-900 hover:text-white transition-all duration-300 shadow-sm"
                >
                    Login
                </button>
            </nav>

            {/* ===== MAIN CONTENT ===== */}
            <div className="relative z-20 flex flex-col lg:flex-row items-start justify-between px-8 lg:px-14 pt-8 lg:pt-16 pb-0 max-w-[1440px] mx-auto gap-10">

                {/* LEFT — Hero Copy */}
                <div className={`flex-1 max-w-xl pt-0 lg:pt-6 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-sm border border-white/30 mb-6 shadow-sm"
                        style={{ animation: 'fade-up 0.6s ease-out 0.1s both' }}>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">AI-Powered Platform</span>
                    </div>

                    <h1 className="text-[3.5rem] lg:text-[4.2rem] font-black text-slate-900 leading-[1.05] tracking-tight mb-5"
                        style={{ fontFamily: "'Georgia', 'Times New Roman', serif", animation: 'fade-up 0.6s ease-out 0.2s both' }}>
                        Your Global<br />
                        <span style={{ background: 'linear-gradient(135deg, #0891b2, #059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Shipping
                        </span>{' '}
                        Partner
                    </h1>

                    <p className="text-lg text-slate-600 leading-relaxed max-w-md mb-8"
                        style={{ fontFamily: "'Georgia', serif", animation: 'fade-up 0.6s ease-out 0.35s both' }}>
                        Reliable, efficient, and swift supply chain solutions tailored for you.
                    </p>

                    {/* Stats row */}
                    <div className="flex items-center gap-6 flex-wrap" style={{ animation: 'fade-up 0.6s ease-out 0.5s both' }}>
                        {[
                            { val: '190+', lab: 'Countries' },
                            { val: '24/7', lab: 'Monitoring' },
                            { val: '99.9%', lab: 'Uptime' },
                            { val: '< 2s', lab: 'AI Recovery' },
                        ].map((s, i) => (
                            <div key={i} className="text-center px-4 py-3 rounded-2xl bg-white/50 backdrop-blur-sm border border-white/40 shadow-sm">
                                <div className="text-xl font-black text-cyan-700">{s.val}</div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">{s.lab}</div>
                            </div>
                        ))}
                    </div>

                    {/* Trust avatars */}
                    <div className="flex items-center gap-3 mt-8" style={{ animation: 'fade-up 0.6s ease-out 0.65s both' }}>
                        <div className="flex -space-x-2">
                            {['#0891b2', '#059669', '#d97706', '#7c3aed'].map((c, i) => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white shadow-sm" style={{ backgroundColor: c }}>
                                    {['JD', 'AK', 'MR', 'TL'][i]}
                                </div>
                            ))}
                        </div>
                        <div>
                            <span className="text-sm font-bold text-slate-900">143.4k+ </span>
                            <span className="text-sm text-slate-500 underline decoration-dashed underline-offset-2 cursor-pointer hover:text-cyan-700 transition-colors">Customer Reviews</span>
                        </div>
                    </div>
                </div>

                {/* RIGHT — Login Form */}
                <div
                    id="login-form"
                    className={`w-full max-w-[420px] transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                    style={{ transitionDelay: '250ms' }}
                >
                    <div className="card-glass rounded-3xl shadow-2xl shadow-slate-900/10 p-7">
                        {/* Tab Header */}
                        <div className="flex border-b border-slate-200 mb-5">
                            {[
                                { active: !isRegister, label: 'Sign In', icon: LogIn, onClick: () => { setIsRegister(false); setError(''); } },
                                { active: isRegister, label: 'Register', icon: UserPlus, onClick: () => { setIsRegister(true); setError(''); } },
                            ].map((tab, i) => (
                                <button key={i} onClick={tab.onClick}
                                    className={`flex-1 flex items-center justify-center gap-2 pb-3 text-sm font-bold border-b-[3px] transition-all
                                    ${tab.active ? 'text-cyan-700 border-cyan-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>
                                    <tab.icon className="w-4 h-4" /> {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Role Selector */}
                        <div className="flex gap-2 mb-5">
                            {Object.entries(roleConfig)
                                .filter(([key]) => !isRegister || key !== 'admin')
                                .map(([key, config]) => {
                                    const Icon = config.icon;
                                    const active = role === key;
                                    return (
                                        <button key={key} type="button" onClick={() => setRole(key)}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border-2
                                            ${active ? 'text-white shadow-md' : 'border-slate-200 text-slate-500 hover:border-slate-300 bg-white'}`}
                                            style={active ? { borderColor: config.color, backgroundColor: config.color } : {}}>
                                            <Icon className="w-4 h-4" /> {config.label}
                                        </button>
                                    );
                                })}
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-3.5">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-0.5">Username</label>
                                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="input-field" placeholder="Enter your username" required />
                            </div>

                            {isRegister && (
                                <>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-0.5">Email</label>
                                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="your@company.com" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-0.5">Company</label>
                                        <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="input-field" placeholder="Your Company Inc." />
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-0.5">Password</label>
                                <div className="relative">
                                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="input-field pr-12" placeholder="••••••••" required />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-600 transition-colors">
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {isRegister && (
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-0.5">Confirm Password</label>
                                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-field" placeholder="••••••••" required />
                                </div>
                            )}

                            {!isRegister && (
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}
                                            className="w-4 h-4 rounded border-2 border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer accent-cyan-600" />
                                        <span className="text-sm text-slate-500 group-hover:text-slate-700">Remember me</span>
                                    </label>
                                </div>
                            )}

                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                                    <p className="text-red-600 text-sm font-medium">{error}</p>
                                </div>
                            )}
                            {success && (
                                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                                    <p className="text-emerald-600 text-sm font-medium">{success}</p>
                                </div>
                            )}

                            <button type="submit" disabled={loading}
                                className={`w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-300 group shadow-lg
                                ${loading ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'}`}
                                style={{ background: isRegister ? 'linear-gradient(135deg, #059669, #0d9488)' : 'linear-gradient(135deg, #dc2626, #ef4444)', boxShadow: isRegister ? '0 8px 24px rgba(5,150,105,0.3)' : '0 8px 24px rgba(220,38,38,0.25)' }}>
                                {loading ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> {isRegister ? 'Creating...' : 'Signing in...'}</>
                                ) : (
                                    <><span>{isRegister ? 'Create Account' : 'Sign In'}</span><ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                                )}
                            </button>
                        </form>

                        <div className="text-center mt-5">
                            <button onClick={toggleMode} className="text-sm text-slate-500 hover:text-cyan-700 transition-colors font-medium">
                                {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register now"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== BOTTOM TRUST BAR ===== */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-6 px-6 py-2.5 rounded-full shadow-sm"
                style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.4)' }}>
                {[
                    { emoji: '🛡️', text: 'SOC 2 Type II' },
                    { emoji: '🔒', text: '256-bit SSL' },
                    { emoji: '🌍', text: '190+ Countries' },
                    { emoji: '⚡', text: '99.9% SLA' },
                ].map((b, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                        <span className="text-sm">{b.emoji}</span>
                        <span className="text-[11px] font-bold text-slate-700">{b.text}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
