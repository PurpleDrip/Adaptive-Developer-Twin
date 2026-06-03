'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Terminal, Shield, Zap, Info } from 'lucide-react';
import axios from 'axios';

const WS_URL = 'ws://127.0.0.1:8007/api/v1/monitoring/ws/audit';
const REST_URL = 'http://127.0.0.1:8007/api/v1/monitoring/audit-log';

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
    const [reconnectCount, setReconnectCount] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const cancelledRef = useRef(false);

    const connect = useCallback(() => {
        if (cancelledRef.current) return;

        if (wsRef.current) {
            wsRef.current.onopen = null;
            wsRef.current.onmessage = null;
            wsRef.current.onclose = null;
            wsRef.current.onerror = null;
            wsRef.current.close();
        }

        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
            if (cancelledRef.current) { ws.close(); return; }
            setIsConnected(true);
            setReconnectCount(0);
        };

        ws.onmessage = (event) => {
            if (cancelledRef.current) return;
            try {
                const newLog = JSON.parse(event.data);
                const incomingId = newLog.id || newLog._id;
                setLogs(prev => {
                    if (prev.some(l => l.id === incomingId)) return prev;
                    return [{ ...newLog, id: incomingId }, ...prev].slice(0, 100);
                });
            } catch {}
        };

        ws.onclose = () => {
            if (cancelledRef.current) return;
            setIsConnected(false);
            // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
            setReconnectCount(prev => {
                const next = prev + 1;
                const delay = Math.min(1000 * Math.pow(2, prev), 30000);
                retryTimerRef.current = setTimeout(connect, delay);
                return next;
            });
        };

        ws.onerror = () => {
            ws.close();
        };
    }, []);

    useEffect(() => {
        cancelledRef.current = false;

        // Seed from REST once
        axios.get(REST_URL)
            .then(res => {
                if (cancelledRef.current) return;
                const seeded = res.data.map((l: any) => ({ ...l, id: l._id || l.id }));
                setLogs(seeded);
            })
            .catch(() => {});

        connect();

        return () => {
            cancelledRef.current = true;
            if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
            if (wsRef.current) {
                wsRef.current.onclose = null;
                wsRef.current.close();
            }
        };
    }, [connect]);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }, [logs]);

    const getActionIcon = (action: string) => {
        if (action.includes('thg')) return <Zap size={14} className="text-yellow-400" />;
        if (action.includes('config')) return <Shield size={14} className="text-blue-400" />;
        if (action.includes('registration')) return <Zap size={14} className="text-green-400" />;
        return <Info size={14} className="text-gray-400" />;
    };

    return (
        <div className="glass-card h-full flex flex-col overflow-hidden border-zinc-800">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <Terminal size={18} className="text-blue-500" />
                    <h3 className="font-bold text-sm uppercase tracking-wider">Live Audit Pipeline</h3>
                </div>
                <div className="flex items-center gap-3 text-[10px]">
                    {!isConnected && reconnectCount > 0 && (
                        <span className="text-yellow-500 font-mono">reconnecting #{reconnectCount}…</span>
                    )}
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                        <span className="text-gray-500">{isConnected ? 'STREAMING' : 'DISCONNECTED'}</span>
                    </div>
                </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-[11px]">
                {logs.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-600 italic">
                        Waiting for system events…
                    </div>
                ) : (
                    logs.map((log) => (
                        <div key={log.id} className="p-2 rounded hover:bg-zinc-900/50 flex items-center gap-3 group border border-transparent hover:border-zinc-800 transition-all">
                            <span className="text-zinc-600 whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString()}</span>
                            <div className="flex items-center gap-1.5 min-w-0 sm:min-w-[130px]">
                                {getActionIcon(log.action)}
                                <span className="text-blue-400 font-bold uppercase truncate">{log.action.replace(/_/g, ' ')}</span>
                            </div>
                            <span className="text-zinc-400 truncate max-w-[160px]">USR: {log.user_id}</span>
                            <span className="text-zinc-600 ml-auto bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 group-hover:text-zinc-300 whitespace-nowrap">
                                SRC: {log.source}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
