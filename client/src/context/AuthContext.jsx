import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check for existing auth on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('aegis_user');
        const storedToken = localStorage.getItem('aegis_token');

        if (storedUser && storedToken) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (username, password, role) => {
        try {
            const response = await api.post('/auth/login', { username, password, role });

            if (response.data.success) {
                const userData = response.data.user;
                const mockToken = 'jwt-token-' + Date.now();

                localStorage.setItem('aegis_user', JSON.stringify(userData));
                localStorage.setItem('aegis_token', mockToken);

                setUser(userData);
                return { success: true, user: userData };
            } else {
                return { success: false, error: response.data.error };
            }
        } catch (error) {
            console.error('Login failed:', error);
            return { success: false, error: error.response?.data?.error || 'Login failed' };
        }
    };

    const register = async (username, password, role, companyName, email) => {
        try {
            const response = await api.post('/auth/register', {
                username,
                password,
                role,
                company_name: companyName,
                email
            });

            if (response.data.success) {
                // Auto-login after registration
                const userData = response.data.user;
                const mockToken = 'jwt-token-' + Date.now();

                localStorage.setItem('aegis_user', JSON.stringify(userData));
                localStorage.setItem('aegis_token', mockToken);

                setUser(userData);
                return { success: true, user: userData };
            } else {
                return { success: false, error: response.data.error };
            }
        } catch (error) {
            console.error('Registration failed:', error);
            return { success: false, error: error.response?.data?.error || 'Registration failed' };
        }
    };

    const logout = () => {
        localStorage.removeItem('aegis_user');
        localStorage.removeItem('aegis_token');
        setUser(null);
    };

    const value = {
        user,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        loading,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export default AuthContext;
