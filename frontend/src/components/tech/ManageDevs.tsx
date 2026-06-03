'use client';

import React, { useEffect, useState } from 'react';
import { Users, Loader2, RefreshCw, Check, UserCheck, UserX } from 'lucide-react';
import { authApi } from '@/lib/api';

interface Dev {
    user_id: string;
    name: string;
    manager_id?: string | null;
    squad?: string;
    experience_level?: string;
}

interface Manager {
    user_id: string;
    name: string;
    department?: string;
    email?: string;
}

type FilterMode = 'all' | 'assigned' | 'unassigned';

export const ManageDevs: React.FC = () => {
    const [devs, setDevs] = useState<Dev[]>([]);
    const [managers, setManagers] = useState<Manager[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<FilterMode>('all');
    const [assigningId, setAssigningId] = useState<string | null>(null);

    const managerMap: Record<string, Manager> = {};
    managers.forEach(m => { managerMap[m.user_id] = m; });

    const fetchAll = async () => {
        setLoading(true);
        setError(null);
        try {
            const [devsResp, mgrResp] = await Promise.all([
                authApi.getAllUsers(),
                authApi.getManagers(),
            ]);
            setDevs(Array.isArray(devsResp.data) ? devsResp.data : []);
            setManagers(Array.isArray(mgrResp.data) ? mgrResp.data : []);
        } catch (err: any) {
            setError(err?.response?.data?.detail || 'Failed to load developers / managers');
        }
        setLoading(false);
    };

    useEffect(() => { fetchAll(); }, []);

    const handleAssign = async (devId: string, managerId: string) => {
        if (!managerId) return;
        setAssigningId(devId);
        try {
            await authApi.assignManager(devId, managerId);
            // Optimistically reflect the assignment locally
            setDevs(prev => prev.map(d =>
                d.user_id === devId ? { ...d, manager_id: managerId } : d
            ));
        } catch (err: any) {
            setError(err?.response?.data?.detail || 'Assignment failed');
        }
        setAssigningId(null);
    };

    const isAssigned = (d: Dev) => !!(d.manager_id && managerMap[d.manager_id]);

    const filteredDevs = devs.filter(d => {
        if (filter === 'assigned') return isAssigned(d);
        if (filter === 'unassigned') return !isAssigned(d);
        return true;
    });

    const assignedCount = devs.filter(isAssigned).length;
    const unassignedCount = devs.length - assignedCount;

    return (
        <div className="h-full overflow-auto glass-card border-zinc-800 p-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                        <Users size={18} className="text-cyan-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Manage Devs</h2>
                        <p className="text-[11px] text-zinc-500">
                            {devs.length} developers · {assignedCount} assigned · {unassignedCount} unassigned
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex gap-1 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800">
                        {([
                            { id: 'all', label: 'All' },
                            { id: 'assigned', label: 'Assigned' },
                            { id: 'unassigned', label: 'Unassigned' },
                        ] as { id: FilterMode, label: string }[]).map(f => (
                            <button
                                key={f.id}
                                onClick={() => setFilter(f.id)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filter === f.id ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20' : 'text-zinc-500 hover:text-white'}`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={fetchAll}
                        className="p-2 rounded-lg border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700 transition-all"
                        title="Refresh"
                    >
                        <RefreshCw size={14} />
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-4 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-20 text-zinc-500">
                    <Loader2 size={20} className="animate-spin mr-2" /> Loading developers…
                </div>
            ) : filteredDevs.length === 0 ? (
                <div className="py-20 text-center text-zinc-600 text-sm">No developers match this filter.</div>
            ) : (
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500 border-b border-zinc-800">
                            <th className="py-3 px-3 font-medium">Developer</th>
                            <th className="py-3 px-3 font-medium">Squad</th>
                            <th className="py-3 px-3 font-medium">Manager</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredDevs.map(dev => (
                            <tr key={dev.user_id} className="border-b border-zinc-900 hover:bg-zinc-900/40 transition-colors">
                                <td className="py-3 px-3">
                                    <div className="text-white font-medium">{dev.name}</div>
                                    <div className="text-[10px] font-mono text-zinc-600">{dev.user_id}</div>
                                </td>
                                <td className="py-3 px-3 text-zinc-400 capitalize">{dev.squad || '—'}</td>
                                <td className="py-3 px-3">
                                    {isAssigned(dev) ? (
                                        <span className="inline-flex items-center gap-2 text-zinc-200">
                                            <UserCheck size={14} className="text-green-500" />
                                            {managerMap[dev.manager_id!].name}
                                        </span>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <UserX size={14} className="text-yellow-500 shrink-0" />
                                            <select
                                                defaultValue=""
                                                disabled={assigningId === dev.user_id}
                                                onChange={(e) => handleAssign(dev.user_id, e.target.value)}
                                                className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none disabled:opacity-50"
                                            >
                                                <option value="" disabled>Assign a manager…</option>
                                                {managers.map(m => (
                                                    <option key={m.user_id} value={m.user_id}>
                                                        {m.name}{m.department ? ` — ${m.department}` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                            {assigningId === dev.user_id && (
                                                <Loader2 size={14} className="animate-spin text-cyan-500" />
                                            )}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};
