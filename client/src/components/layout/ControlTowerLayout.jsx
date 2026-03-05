import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import GlobalAlertBar from '../alerts/GlobalAlertBar';
import AgentTerminal from '../AgentTerminal';
import { Terminal, X } from 'lucide-react';

/**
 * Control Tower Layout - Premium Industrial Dashboard Frame
 * 
 * Structure:
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ [GLOBAL ALERT BAR - Crisis notifications]                      │
 * ├──────────┬──────────────────────────────────┬──────────────────┤
 * │          │                                  │                  │
 * │ SIDEBAR  │        MAIN CONTENT              │   AI TERMINAL    │
 * │   NAV    │        (Dashboard)               │     (Logs)       │
 * │          │                                  │                  │
 * └──────────┴──────────────────────────────────┴──────────────────┘
 */
export default function ControlTowerLayout({ children }) {
    const { user } = useAuth();
    const [showTerminal, setShowTerminal] = useState(false);
    const [terminalLogs, setTerminalLogs] = useState([
        '[SYSTEM] Aegis Nexus Control Tower initialized',
        '[SYSTEM] Multi-Agent System on standby',
        '[SYSTEM] Monitoring supply chain events...',
    ]);
    const [crisisMode, setCrisisMode] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Expose functions to children via context or props
    const addTerminalLog = (log) => {
        setTerminalLogs(prev => [...prev, log]);
    };

    const addTerminalLogs = (logs) => {
        setTerminalLogs(prev => [...prev, ...logs]);
    };

    const triggerCrisisMode = (enabled) => {
        setCrisisMode(enabled);
        if (enabled) {
            addTerminalLog('[ALERT] ⚠️ CRISIS MODE ACTIVATED');
        }
    };

    return (
        <div className="h-screen overflow-hidden bg-slate-50 flex flex-col selection:bg-blue-100">
            {/* Global Alert Bar */}
            <GlobalAlertBar crisisMode={crisisMode} />

            {/* Main Layout */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* Floating Sidebar Container */}
                <Sidebar
                    collapsed={sidebarCollapsed}
                    onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                    userRole={user?.role}
                />

                {/* Main Content Area */}
                <main className={`flex-1 overflow-y-auto p-8 transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-72'
                    } ${showTerminal ? 'mr-96' : ''}`}>
                    <div className="max-w-[1600px] mx-auto">
                        {/* Pass context to children */}
                        {typeof children === 'function'
                            ? children({ addTerminalLog, addTerminalLogs, triggerCrisisMode, setShowTerminal })
                            : children
                        }
                    </div>
                </main>

                {/* AI Terminal Panel (Right Side) - Glassmorphism */}
                <div className={`fixed right-0 top-0 h-full w-96 backdrop-blur-2xl border-l border-slate-200 
                    bg-white/70 transform transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] z-40 flex flex-col shadow-2xl
                    ${showTerminal ? 'translate-x-0' : 'translate-x-full'}`}
                >
                    {/* Terminal Header */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white/50">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                                <Terminal className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-bold text-slate-900 text-sm tracking-tight">
                                Aegis AI Engine
                            </span>
                        </div>
                        <button
                            onClick={() => setShowTerminal(false)}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-all"
                        >
                            <X className="w-4 h-4 text-slate-400" />
                        </button>
                    </div>

                    {/* Terminal Content */}
                    <div className="flex-1 overflow-hidden p-4">
                        <AgentTerminal
                            logs={terminalLogs}
                            isEmbedded={true}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
