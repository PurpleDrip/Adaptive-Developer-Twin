'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Shield, Zap, Info, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface AuditLog {
    id: string;
    user_id: string;
    action: string;
    source: string;
    timestamp: string;
}

export const LiveAuditHUD: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Single source: WebSocket. Initial seed is fetched once via REST,
        // then live updates stream in. Each entry is keyed by id; the WS
        // handler skips duplicates so the same audit event never renders twice.
        let cancelled = false;

        axios.get('http://127.0.0.1:8007/api/v1/monitoring/audit-log')
            .then(res => {
                if (cancelled) return;
                const seeded = res.data.map((l: any) => ({ ...l, id: l._id || l.id }));
                setLogs(seeded);
            })
            .catch(err => console.error("Failed to fetch historical audit logs", err));

        const ws = new WebSocket(`ws://127.0.0.1:8007/api/v1/monitoring/ws/audit`);

        ws.onopen = () => setIsConnected(true);
        ws.onmessage = (event) => {
            const newLog = JSON.parse(event.data);
            const incomingId = newLog.id || newLog._id;
            setLogs(prev => {
                if (prev.some(l => l.id === incomingId)) return prev;
                return [{ ...newLog, id: incomingId }, ...prev].slice(0, 50);
            });
        };
        ws.onclose = () => setIsConnected(false);

        return () => { cancelled = true; ws.close(); };
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = 0;
        }
    }, [logs]);

    const getActionIcon = (action: string) => {
        if (action.includes('thg')) return <Zap size={14} className="text-yellow-400" />;
        if (action.includes('config')) return <Shield size={14} className="text-blue-400" />;
        if (action.includes('registration')) return <Zap size={14} className="text-green-400" />;
        return <Info size={14} className="text-gray-400" />;
    };

    return (
        <div className="glass-card h-[400px] flex flex-col overflow-hidden border-zinc-800">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                <div className="flex items-center gap-2">
                    <Terminal size={18} className="text-blue-500" />
                    <h3 className="font-bold text-sm uppercase tracking-wider">Live Audit Pipeline</h3>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className="text-gray-500">{isConnected ? 'STREAMING' : 'DISCONNECTED'}</span>
                </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-[11px]">
                {logs.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-600 italic">
                        Waiting for system events...
                    </div>
                ) : (
                    logs.map((log) => (
                        <div key={log.id} className="p-2 rounded hover:bg-zinc-900/50 flex items-center gap-3 animate-slide-in group border border-transparent hover:border-zinc-800 transition-all">
                            <span className="text-zinc-600">{new Date(log.timestamp).toLocaleTimeString()}</span>
                            <div className="flex items-center gap-1.5 min-w-[120px]">
                                {getActionIcon(log.action)}
                                <span className="text-blue-400 font-bold uppercase">{log.action.replace('_', ' ')}</span>
                            </div>
                            <span className="text-zinc-400 truncate max-w-[150px]">USR: {log.user_id}</span>
                            <span className="text-zinc-600 ml-auto bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 group-hover:text-zinc-300">
                                SRC: {log.source}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
