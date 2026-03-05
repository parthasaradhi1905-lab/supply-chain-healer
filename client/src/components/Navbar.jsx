import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, LogOut, User } from 'lucide-react';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="glass-card px-6 py-4 mb-6">
            <div className="flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-3">
                    <Shield className="w-8 h-8 text-accent-primary" strokeWidth={1.5} />
                    <div>
                        <h1 className="text-xl font-heading font-bold text-gradient">
                            AEGIS NEXUS
                        </h1>
                        <p className="text-xs text-text-muted uppercase tracking-wider">
                            {user?.role === 'buyer' ? 'Buyer Portal' : user?.role === 'supplier' ? 'Supplier Portal' : 'Admin Console'}
                        </p>
                    </div>
                </div>

                {/* User Info & Logout */}
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-text-muted" />
                            <p className="text-sm font-semibold text-text-primary">{user?.username}</p>
                        </div>
                        <p className="text-xs text-text-muted">{user?.company_name}</p>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="btn-secondary flex items-center gap-2 px-4 py-2"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:inline">Logout</span>
                    </button>
                </div>
            </div>
        </nav>
    );
}
