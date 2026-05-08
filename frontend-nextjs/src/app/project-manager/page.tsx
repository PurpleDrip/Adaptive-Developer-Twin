'use client';

import React, { useEffect, useState } from 'react';
import {
    Users, TrendingUp, Plus, Search, Sparkles, Filter,
    ChevronRight, Briefcase, Activity, Zap
} from 'lucide-react';
import { authApi, taskApi, analyticsApi } from '@/lib/api';

export default function ProjectManagerDashboard() {
    const [devs, setDevs] = useState<any[]>([]);
    const [stats, setStats] = useState({ total_devs: 0, high_risk: 0, avg_satisfaction: 0 });
    const [loading, setLoading] = useState(true);

    const [taskInput, setTaskInput] = useState({ title: '', description: '', required_skills: '' });
    const [suggestedDevs, setSuggestedDevs] = useState<any[]>([]);
    const [isMatching, setIsMatching] = useState(false);

    useEffect(() => {
        const fetchOrgData = async () => {
            try {
                const sessionStr = localStorage.getItem('adt_user');
                if (!sessionStr) { window.location.href = '/login?role=project_manager'; return; }
                const session = JSON.parse(sessionStr);
                if (session.role !== 'manager' && session.role !== 'PM') {
                    window.location.href = '/login?role=project_manager'; return;
                }

                // Fetch Squad Data (Isolated for this manager)
                const resp = await authApi.getSquad(session.user_id);
                const devList = resp.data;

                const devsWithPerformance = await Promise.all(devList.map(async (dev: any) => {
                    try {
                        const perfResp = await analyticsApi.getSummary(dev.user_id);
                        const taskResp = await taskApi.getUserTasks(dev.user_id);
                        return { ...dev, performance: perfResp.data, current_task: taskResp.data[0] || null };
                    } catch { return { ...dev, performance: {}, current_task: null }; }
                }));

                setDevs(devsWithPerformance);

                const highRiskCount = devsWithPerformance.filter(d => d.performance?.learning_velocity === "RISING").length;
                const totalWpm = devsWithPerformance.reduce((acc, d) => acc + (d.performance?.wpm || 0), 0);
                const avgWpm = devList.length > 0 ? Math.round(totalWpm / devList.length) : 0;

                setStats({ total_devs: devList.length, high_risk: highRiskCount, avg_satisfaction: avgWpm });
            } catch (e) { console.error("PM Data fetch failed", e); }
            finally { setLoading(false); }
        };
        fetchOrgData();
    }, []);

    const handleGetSuggestions = async () => {
        if (!taskInput.title || !taskInput.required_skills) return;
        setIsMatching(true);
        try {
            const skills = taskInput.required_skills.split(',').reduce((acc: any, s) => {
                acc[s.trim()] = 1.0; return acc;
            }, {});
            const resp = await taskApi.createTask({
                title: taskInput.title, description: taskInput.description, required_skills: skills
            });
            setSuggestedDevs(resp.data.top_candidates || []);
        } catch (e) { console.error("Matching failed", e); }
        finally { setIsMatching(false); }
    };

    const handleAssignTask = async (devId: string, taskId: string) => {
        try {
            const session = JSON.parse(localStorage.getItem('adt_user') || '{}');
            await taskApi.assignTask(taskId, { assigned_to: devId, assigned_by: session.user_id || "system_admin" });
            alert(`Task assigned to ${devId}`);
            setSuggestedDevs([]);
            setTaskInput({ title: '', description: '', required_skills: '' });
        } catch { alert("Assignment failed"); }
    };

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="flex items-center gap-3 text-blue-500">
                <Activity size={20} className="animate-pulse" />
                <span className="text-sm font-medium">Synchronizing team intel...</span>
            </div>
        </div>
    );

    return (
        <div className="max-w-[1400px] mx-auto p-6 lg:p-8 space-y-6 animate-fade">
            {/* Header */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <Users size={16} className="text-white" />
                        </div>
                        <span className="text-xs text-zinc-500 font-medium">Adaptive Developer Twin</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white">
                        Squad <span className="text-zinc-500">Oversight</span>
                    </h1>
                    <p className="text-sm text-zinc-500 mt-1">Manage your team, allocate tasks, and monitor velocity.</p>
                </div>
                <div className="flex gap-6">
                    {[
                        { label: 'Team Size', val: stats.total_devs, color: 'blue' },
                        { label: 'High Risk', val: stats.high_risk, color: 'red' },
                        { label: 'Avg Velocity', val: `${stats.avg_satisfaction} wpm`, color: 'green' }
                    ].map(s => (
                        <div key={s.label} className="text-right">
                            <p className="text-xs text-zinc-500 mb-1">{s.label}</p>
                            <p className="text-2xl font-bold text-white">{s.val}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Left: AI Matching */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                    <div className="glass-card p-6 border-blue-500/20 bg-blue-500/5 relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 opacity-10">
                            <Sparkles size={160} className="text-blue-500" />
                        </div>
                        <h3 className="text-sm font-semibold text-blue-400 mb-6 flex items-center gap-2">
                            <Sparkles size={14} /> AI Candidate Matching
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-zinc-500 block mb-1.5">Task Title</label>
                                <input className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-sm focus:border-blue-500 outline-none transition-all"
                                    placeholder="e.g. Migration to Rust"
                                    value={taskInput.title} onChange={e => setTaskInput({...taskInput, title: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs text-zinc-500 block mb-1.5">Required Skills (comma separated)</label>
                                <input className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-sm focus:border-blue-500 outline-none transition-all"
                                    placeholder="rust, kubernetes, security"
                                    value={taskInput.required_skills} onChange={e => setTaskInput({...taskInput, required_skills: e.target.value})} />
                            </div>
                            <button onClick={handleGetSuggestions} disabled={isMatching}
                                className="w-full btn-large bg-blue-600 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                                {isMatching ? 'Finding best match...' : 'Get Suggested Developers'}
                            </button>
                        </div>

                        {suggestedDevs.length > 0 && (
                            <div className="mt-6 pt-6 border-t border-zinc-800 space-y-3">
                                <p className="text-xs text-zinc-500 mb-3">Ranked Matches</p>
                                {suggestedDevs.map((dev: any) => (
                                    <div key={dev.dev_id} className="p-3 bg-black border border-zinc-800 rounded-xl flex items-center justify-between hover:border-blue-500/50 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-xs font-bold text-blue-500">
                                                {dev.name?.[0]}
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium">{dev.name}</p>
                                                <p className="text-[10px] text-green-500">Match: {(dev.score * 100).toFixed(1)}%</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleAssignTask(dev.dev_id, "PENDING")}
                                            className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-xs text-blue-500 hover:bg-blue-600 hover:text-white transition-all">
                                            Assign
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Developer Grid */}
                <div className="col-span-12 lg:col-span-8">
                    <div className="glass-card border-zinc-800">
                        <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/30">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                                <Users size={14} className="text-blue-500" /> Active Developers
                            </h3>
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                                <input className="bg-black border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs outline-none focus:border-blue-500 w-56"
                                    placeholder="Filter by name..." />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-zinc-900/50">
                                    <tr>
                                        <th className="p-4 text-xs text-zinc-500 font-medium">Developer</th>
                                        <th className="p-4 text-xs text-zinc-500 font-medium">Current Task</th>
                                        <th className="p-4 text-xs text-zinc-500 font-medium">Velocity</th>
                                        <th className="p-4 text-xs text-zinc-500 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-900">
                                    {devs.length > 0 ? devs.map((dev) => (
                                        <tr key={dev.user_id} className="hover:bg-zinc-900/20 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-400">
                                                        {dev.name?.[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">{dev.name}</p>
                                                        <p className="text-[10px] text-zinc-500">{dev.user_id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {dev.current_task ? (
                                                    <p className="text-xs text-zinc-300">{dev.current_task.title}</p>
                                                ) : (
                                                    <span className="text-xs text-zinc-700 italic">No task active</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-1.5 bg-zinc-900 rounded-full overflow-hidden w-20">
                                                        <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, ((dev.performance?.wpm || 0) / 80) * 100)}%` }} />
                                                    </div>
                                                    <span className="text-xs font-mono">{dev.performance?.wpm || 0}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${dev.current_task ? 'bg-blue-500 animate-pulse' : 'bg-zinc-700'}`} />
                                                    <span className="text-xs text-zinc-400">
                                                        {dev.current_task ? 'Engaged' : 'Available'}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="p-10 text-center text-sm text-zinc-600 italic">
                                                No developers assigned to your squad yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
