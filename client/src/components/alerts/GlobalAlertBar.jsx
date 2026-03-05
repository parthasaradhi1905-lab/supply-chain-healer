import { useState, useEffect } from 'react';
import { AlertTriangle, X, Shield, Activity } from 'lucide-react';

/**
 * Global Alert Bar - Top-of-screen crisis indicator
 * 
 * Shows pulsing red "CRISIS MODE" banner when disruption is active
 */
export default function GlobalAlertBar({ crisisMode, alertMessage }) {
    const [visible, setVisible] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (crisisMode && !dismissed) {
            setVisible(true);
        } else if (!crisisMode) {
            setDismissed(false);
            setVisible(false);
        }
    }, [crisisMode, dismissed]);

    if (!visible) {
        return null;
    }

    return (
        <div className="relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-accent-danger/20 via-accent-danger/30 to-accent-danger/20 
                animate-pulse" />

            {/* Scanning Line Effect */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 left-0 w-1/4 h-full bg-gradient-to-r from-transparent 
                    via-accent-danger/40 to-transparent animate-scan" />
            </div>

            {/* Content */}
            <div className="relative h-10 bg-accent-danger/10 backdrop-blur-sm border-b border-accent-danger/50 
                flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-accent-danger animate-pulse" />
                    <span className="text-sm font-bold text-accent-danger uppercase tracking-widest 
                        font-heading animate-pulse">
                        ⚠ CRISIS MODE ACTIVE
                    </span>
                    {alertMessage && (
                        <span className="text-sm text-text-primary ml-4 font-mono">
                            {alertMessage}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-xs text-accent-danger/80 font-mono uppercase">
                        AI Recovery in Progress
                    </span>
                    <button
                        onClick={() => setDismissed(true)}
                        className="p-1 hover:bg-accent-danger/20 rounded transition-colors"
                        title="Dismiss"
                    >
                        <X className="w-4 h-4 text-accent-danger/60 hover:text-accent-danger" />
                    </button>
                </div>
            </div>
        </div>
    );
}
