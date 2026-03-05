import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';

const SettingsContext = createContext(null);

const DEFAULT_SETTINGS = {
    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    smsAlerts: false,
    disruptionAlerts: true,
    orderUpdates: true,
    weeklyReport: true,
    // Appearance
    darkMode: false,
    compactView: false,
    animationsEnabled: true,
    // Security
    twoFactorAuth: false,
    sessionTimeout: '30', // minutes
    // Preferences
    language: 'English',
    timezone: 'PST (UTC-8)',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD ($)',
    refreshInterval: '30', // seconds
};

export const SettingsProvider = ({ children }) => {
    const { user, logout } = useAuth();
    const [settings, setSettings] = useState(() => {
        try {
            const stored = localStorage.getItem('aegis_settings');
            return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
        } catch {
            return DEFAULT_SETTINGS;
        }
    });

    const inactivityTimerRef = useRef(null);
    const lastActivityRef = useRef(Date.now());

    // ── Persist settings to localStorage ──
    const updateSettings = useCallback((newSettings) => {
        setSettings(prev => {
            const merged = { ...prev, ...newSettings };
            localStorage.setItem('aegis_settings', JSON.stringify(merged));
            return merged;
        });
    }, []);

    const toggleSetting = useCallback((key) => {
        setSettings(prev => {
            const updated = { ...prev, [key]: !prev[key] };
            localStorage.setItem('aegis_settings', JSON.stringify(updated));
            return updated;
        });
    }, []);

    // ── Apply Dark Mode ──
    useEffect(() => {
        const root = document.documentElement;
        if (settings.darkMode) {
            root.classList.add('dark-mode');
        } else {
            root.classList.remove('dark-mode');
        }
    }, [settings.darkMode]);

    // ── Apply Compact View ──
    useEffect(() => {
        const root = document.documentElement;
        if (settings.compactView) {
            root.classList.add('compact-view');
        } else {
            root.classList.remove('compact-view');
        }
    }, [settings.compactView]);

    // ── Apply Animations Toggle ──
    useEffect(() => {
        const root = document.documentElement;
        if (!settings.animationsEnabled) {
            root.classList.add('no-animations');
        } else {
            root.classList.remove('no-animations');
        }
    }, [settings.animationsEnabled]);

    // ── Session Timeout (Inactivity Logout) ──
    useEffect(() => {
        if (!user) return;

        const timeoutMs = parseInt(settings.sessionTimeout) * 60 * 1000;

        const resetTimer = () => {
            lastActivityRef.current = Date.now();
        };

        const checkInactivity = () => {
            const elapsed = Date.now() - lastActivityRef.current;
            if (elapsed >= timeoutMs) {
                logout();
                alert('Session expired due to inactivity. Please log in again.');
            }
        };

        // Listen for user activity
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
        events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));

        // Check every 30 seconds
        inactivityTimerRef.current = setInterval(checkInactivity, 30000);

        return () => {
            events.forEach(e => window.removeEventListener(e, resetTimer));
            if (inactivityTimerRef.current) clearInterval(inactivityTimerRef.current);
        };
    }, [user, settings.sessionTimeout, logout]);

    // ── Date Formatting Utility ──
    const formatDate = useCallback((dateStr) => {
        if (!dateStr) return '—';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;

            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();

            switch (settings.dateFormat) {
                case 'DD/MM/YYYY': return `${day}/${month}/${year}`;
                case 'YYYY-MM-DD': return `${year}-${month}-${day}`;
                case 'MM/DD/YYYY':
                default: return `${month}/${day}/${year}`;
            }
        } catch {
            return dateStr;
        }
    }, [settings.dateFormat]);

    // ── Friendly Date (for dashboard display) ──
    const formatFriendlyDate = useCallback((dateStr) => {
        if (!dateStr) return '—';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch {
            return dateStr;
        }
    }, []);

    // ── Currency Formatting Utility ──
    const formatCurrency = useCallback((amount) => {
        if (amount == null || isNaN(amount)) return '—';
        const num = parseFloat(amount);

        const currencyMap = {
            'USD ($)': { locale: 'en-US', currency: 'USD' },
            'EUR (€)': { locale: 'de-DE', currency: 'EUR' },
            'GBP (£)': { locale: 'en-GB', currency: 'GBP' },
            'INR (₹)': { locale: 'en-IN', currency: 'INR' },
            'JPY (¥)': { locale: 'ja-JP', currency: 'JPY' },
        };

        const config = currencyMap[settings.currency] || currencyMap['USD ($)'];
        return new Intl.NumberFormat(config.locale, {
            style: 'currency',
            currency: config.currency,
            minimumFractionDigits: config.currency === 'JPY' ? 0 : 2,
            maximumFractionDigits: config.currency === 'JPY' ? 0 : 2,
        }).format(num);
    }, [settings.currency]);

    // ── Refresh Interval (in ms) ──
    const refreshIntervalMs = parseInt(settings.refreshInterval) * 1000;

    const value = {
        settings,
        updateSettings,
        toggleSetting,
        formatDate,
        formatFriendlyDate,
        formatCurrency,
        refreshIntervalMs,
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within SettingsProvider');
    }
    return context;
};

export default SettingsContext;
