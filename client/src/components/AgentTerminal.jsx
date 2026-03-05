import { useState, useEffect, useRef } from 'react';
import { Terminal, Download, Trash2, Shield, Zap, Activity, Cpu } from 'lucide-react';

/**
 * Agent Terminal - Redesigned for Premium Light Theme
 */
export default function AgentTerminal({ logs, isEmbedded = false, isOpen, onToggle, onClose }) {
    const [displayedLogs, setDisplayedLogs] = useState([]);
    const terminalRef = useRef(null);
    const [isMinimized, setIsMinimized] = useState(false);

    // Update displayed logs when logs change
    useEffect(() => {
        if (!logs || logs.length === 0) {
            setDisplayedLogs([]);
            return;
        }

        setDisplayedLogs(logs);

        // Auto-scroll to bottom
        if (terminalRef.current) {
            setTimeout(() => {
                terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
            }, 50);
        }
    }, [logs]);

    // For standalone mode
    if (!isEmbedded && !isOpen) return null;

    const handleExport = () => {
        const logText = displayedLogs.join('\n');
        const blob = new Blob([logText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `aegis-nexus-log-${Date.now()}.txt`;
        a.click();
    };

    const getAgentColor = (log) => {
        // Darker, high-contrast colors for light background
        if (log.includes('[SENTINEL]')) return 'text-slate-900 font-bold';
        if (log.includes('[ANALYST]')) return 'text-blue-700 font-bold';
        if (log.includes('[NEGOTIATOR]')) return 'text-emerald-700 font-bold';
        if (log.includes('[LOGISTICS]')) return 'text-indigo-700 font-bold';
        if (log.includes('[ORCHESTRATOR]')) return 'text-slate-900 font-black';
        if (log.includes('[NEWS_AGENT]')) return 'text-blue-600 font-medium';
        if (log.includes('[WEATHER_AGENT]')) return 'text-cyan-700 font-medium';
        if (log.includes('[RISK_SCORER]')) return 'text-orange-700 font-bold';
        if (log.includes('[IMPACT_ANALYZER]')) return 'text-rose-700 font-bold';
        if (log.includes('[SUPPLIER_EVALUATOR]')) return 'text-emerald-800 font-bold';
        if (log.includes('[CONTRACT_GENERATOR]')) return 'text-violet-700 font-medium';
        if (log.includes('[PIPELINE]')) return 'text-amber-700 font-black';
        if (log.includes('[SYSTEM]')) return 'text-slate-400 font-mono';
        if (log.includes('[ALERT]')) return 'text-rose-600 font-black uppercase tracking-wider';
        if (log.includes('[ERROR]')) return 'text-rose-600 font-black';
        if (log.includes('✅')) return 'text-emerald-600 font-bold';
        if (log.includes('❌')) return 'text-rose-600 font-bold';
        if (log.includes('⚠️')) return 'text-amber-600 font-bold';
        if (log.includes('╔') || log.includes('╚') || log.includes('║')) return 'text-slate-300 font-light';
        return 'text-slate-600';
    };

    const getAgentIcon = (log) => {
        if (log.includes('[SENTINEL]')) return '🛡️';
        if (log.includes('[ANALYST]')) return '📊';
        if (log.includes('[NEGOTIATOR]')) return '🤝';
        if (log.includes('[LOGISTICS]')) return '🚚';
        if (log.includes('[ORCHESTRATOR]')) return '🤖';
        if (log.includes('[NEWS_AGENT]')) return '📰';
        if (log.includes('[WEATHER_AGENT]')) return '🌪️';
        if (log.includes('[RISK_SCORER]')) return '📈';
        if (log.includes('[IMPACT_ANALYZER]')) return '🎯';
        if (log.includes('[SUPPLIER_EVALUATOR]')) return '⭐';
        if (log.includes('[CONTRACT_GENERATOR]')) return '📄';
        if (log.includes('[PIPELINE]')) return '⚡';
        if (log.includes('[SYSTEM]')) return '⚙️';
        if (log.includes('[ALERT]')) return '🚨';
        if (log.includes('[ERROR]')) return '❌';
        if (log.includes('STAGE')) return '📍';
        return '';
    };

    // Embedded mode - for sidebar panel
    if (isEmbedded) {
        return (
            <div className="h-full flex flex-col bg-slate-50/50 backdrop-blur-sm">
                <div className="flex-none px-4 py-3 bg-white/40 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Real-time Logs</span>
                    </div>
                </div>

                {/* Terminal Content */}
                <div
                    ref={terminalRef}
                    className="flex-1 overflow-y-auto p-4 font-mono text-[11px] scroll-smooth"
                >
                    {displayedLogs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 italic py-12">
                            <Cpu className="w-8 h-8 mb-3 opacity-20 animate-spin-slow" />
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Initializing Neural Link...</p>
                        </div>
                    ) : (
                        <div className="space-y-1.5 opacity-90">
                            {displayedLogs.map((log, idx) => (
                                <div
                                    key={idx}
                                    className={`flex items-start gap-2.5 ${getAgentColor(log)} leading-relaxed group/log`}
                                >
                                    {getAgentIcon(log) && (
                                        <span className="opacity-80 select-none flex-shrink-0 w-4 group-hover/log:scale-125 transition-transform duration-300">
                                            {getAgentIcon(log)}
                                        </span>
                                    )}
                                    <span className="flex-1 break-words tracking-tight">{log}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Status Bar */}
                <div className="px-4 py-3 bg-white/80 border-t border-slate-100 flex items-center justify-between shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-2.5">
                        <div className="relative">
                            <span className="block w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200" />
                            <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-40" />
                        </div>
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">{displayedLogs.length} Events Logged</span>
                    </div>
                    <button
                        onClick={handleExport}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-all active:scale-90"
                        title="Export Log Dump"
                    >
                        <Download className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        );
    }

    // Standalone mode (legacy bottom fixed panel)
    return (
        <div
            className={`fixed bottom-6 right-6 z-[100] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isMinimized ? 'w-16 h-16' : 'w-[450px] h-[550px]'
                }`}
        >
            <div className="w-full h-full bg-white/90 backdrop-blur-2xl rounded-[32px] border border-white/50 shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white/50">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/20">
                            <Terminal className="w-4 h-4 text-white" />
                        </div>
                        {!isMinimized && (
                            <div>
                                <h3 className="font-black text-slate-900 text-sm tracking-tight leading-none mb-1">
                                    AI Agent Terminal
                                </h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">v4.0.2 Stable</p>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {!isMinimized && (
                            <button
                                onClick={handleExport}
                                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-all"
                            >
                                <Download className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={() => setIsMinimized(!isMinimized)}
                            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-all"
                        >
                            {isMinimized ? <Activity className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Content */}
                {!isMinimized && (
                    <div
                        ref={terminalRef}
                        className="flex-1 overflow-y-auto p-6 font-mono text-[12px] bg-slate-50/30 scroll-smooth"
                    >
                        <div className="space-y-2">
                            {displayedLogs.map((log, idx) => (
                                <div
                                    key={idx}
                                    className={`flex items-start gap-3 ${getAgentColor(log)}`}
                                >
                                    <span className="opacity-70 select-none w-5 leading-none mt-0.5">
                                        {getAgentIcon(log)}
                                    </span>
                                    <span className="flex-1 leading-relaxed tracking-tight">{log}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
