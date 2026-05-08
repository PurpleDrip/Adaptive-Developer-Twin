'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { 
    AlertTriangle, Users, TrendingUp, LayoutDashboard, GanttChart,
    Plus, Search, UserPlus, Star, Clock, CheckCircle, ChevronRight,
    Sparkles, Briefcase, Filter
} from 'lucide-react';

import { authApi, taskApi, analyticsApi } from '@/lib/api';

export default function ProjectManagerDashboard() {
    const [devs, setDevs] = useState<any[]>([]);
    const [stats, setStats] = useState({ total_devs: 0, high_risk: 0, avg_satisfaction: 0 });
    const [loading, setLoading] = useState(true);
    
    // Task Allotment State
    const [taskInput, setTaskInput] = useState({ title: '', description: '', required_skills: '' });
    const [suggestedDevs, setSuggestedDevs] = useState<any[]>([]);
    const [isMatching, setIsMatching] = useState(false);

    useEffect(() => {
        const fetchOrgData = async () => {
            try {
                const sessionStr = localStorage.getItem('adt_user');
                if (!sessionStr) {
                    window.location.href = '/login?role=project_manager';
                    return;
                }
                const session = JSON.parse(sessionStr);
                if (session.role !== 'manager' && session.role !== 'PM') {
                    window.location.href = '/login?role=project_manager';
                    return;
                }

                // 1. Fetch Squad Data (Allotted Devs)
                const resp = await authApi.getAllUsers();
                const devList = resp.data.filter((u: any) => u.role === 'developer');
                
                const devsWithPerformance = await Promise.all(devList.map(async (dev: any) => {
                    try {
                        const perfResp = await analyticsApi.getSummary(dev.user_id);
                        const taskResp = await taskApi.getUserTasks(dev.user_id);
                        return { 
                            ...dev, 
                            performance: perfResp.data,
                            current_task: taskResp.data[0] || null
                        };
                    } catch { return { ...dev, performance: {}, current_task: null }; }
                }));

                setDevs(devsWithPerformance);
                
                // Calculate Squad Stats Dynamically
                const highRiskCount = devsWithPerformance.filter(d => d.performance?.learning_velocity === "RISING").length;
                const totalWpm = devsWithPerformance.reduce((acc, d) => acc + (d.performance?.wpm || 0), 0);
                const avgWpm = devList.length > 0 ? Math.round(totalWpm / devList.length) : 0;

                setStats({ 
                    total_devs: devList.length, 
                    high_risk: highRiskCount, 
                    avg_satisfaction: avgWpm // Using Avg WPM as a proxy for operational health
                });
            } catch (e) {
                console.error("PM Data fetch failed", e);
            } finally {
                setLoading(false);
            }
        };
        fetchOrgData();
    }, []);

    const handleGetSuggestions = async () => {
        if (!taskInput.title || !taskInput.required_skills) return;
        setIsMatching(true);
        try {
            // Call Allocation Engine via Task Service
            const skills = taskInput.required_skills.split(',').reduce((acc: any, s) => {
                acc[s.trim()] = 1.0;
                return acc;
            }, {});

            const resp = await taskApi.createTask({
                title: taskInput.title,
                description: taskInput.description,
                required_skills: skills
            });
            
            setSuggestedDevs(resp.data.top_candidates || []);
        } catch (e) {
            console.error("Matching failed", e);
        } finally {
            setIsMatching(false);
        }
    };

    const handleAssignTask = async (devId: string, taskId: string) => {
        try {
            const session = JSON.parse(localStorage.getItem('adt_user') || '{}');
            await taskApi.assignTask(taskId, {
                assigned_to: devId,
                assigned_by: session.user_id || "system_admin"
            });
            alert(`Task successfully allotted to ${devId}`);
            setSuggestedDevs([]);
            setTaskInput({ title: '', description: '', required_skills: '' });
        } catch (e) {
            alert("Allotment failed");
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center font-mono text-blue-500 animate-pulse uppercase tracking-[0.5em]">
            SYNCHRONIZING_TEAM_INTEL...
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto p-8 space-y-8 animate-fade">
            {/* Header Section */}
            <div className="flex justify-between items-end mb-12">
                <div>
                    <div className="flex items-center gap-3 mb-2 text-blue-500">
                        <Users size={18} fill="currentColor" />
                        <span className="text-xs font-bold uppercase tracking-[0.4em]">Managerial_Command_Console</span>
                    </div>
                    <h1 className="text-5xl font-black uppercase italic tracking-tighter">
                        Squad <span className="text-zinc-700">Oversight</span>
                    </h1>
                </div>
                <div className="flex gap-8">
                    {[
                        { label: 'Total_Devs', val: stats.total_devs, color: 'blue' },
                        { label: 'High_Risk', val: stats.high_risk, color: 'red' },
                        { label: 'Avg_Velocity', val: `${stats.avg_satisfaction} WPM`, color: 'green' }
                    ].map(s => (
                        <div key={s.label} className="text-right">
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">{s.label}</p>
                            <p className="text-3xl font-black text-white italic">{s.val}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* Left Column: AI Allocation HUD */}
                <div className="col-span-12 lg:col-span-4 space-y-8">
                    <div className="glass-card p-8 border-blue-500/20 bg-blue-500/5 relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 opacity-10">
                            <Sparkles size={200} className="text-blue-500" />
                        </div>
                        
                        <h3 className="text-sm font-bold uppercase tracking-[0.2em] mb-8 text-blue-400 flex items-center gap-2">
                            <Sparkles size={16} /> AI_Candidate_Matching
                        </h3>
                        
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Task_Title</label>
                                <input 
                                    className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-sm focus:border-blue-500 outline-none transition-all"
                                    placeholder="e.g. Migration to Rust"
                                    value={taskInput.title}
                                    onChange={e => setTaskInput({...taskInput, title: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Required_Skills (Comma Separated)</label>
                                <input 
                                    className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-sm focus:border-blue-500 outline-none transition-all"
                                    placeholder="rust, kubernetes, security"
                                    value={taskInput.required_skills}
                                    onChange={e => setTaskInput({...taskInput, required_skills: e.target.value})}
                                />
                            </div>
                            <button 
                                onClick={handleGetSuggestions}
                                disabled={isMatching}
                                className="w-full btn-large bg-blue-600 font-black uppercase tracking-[0.2em] italic text-sm flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {isMatching ? 'Calculating_Match...' : 'Get_Top_Suggested_Devs'}
                            </button>
                        </div>

                        {/* Suggestions List */}
                        {suggestedDevs.length > 0 && (
                            <div className="mt-8 pt-8 border-t border-zinc-800 space-y-4 animate-fade">
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-4">Ranked_Matches</p>
                                {suggestedDevs.map((dev: any) => (
                                    <div key={dev.dev_id} className="p-4 bg-black border border-zinc-800 rounded-2xl flex items-center justify-between group hover:border-blue-500/50 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-[10px] font-bold text-blue-500">
                                                {dev.name[0]}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-tight">{dev.name}</p>
                                                <p className="text-[10px] text-green-500 font-bold">Match: {(dev.score * 100).toFixed(1)}%</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleAssignTask(dev.dev_id, "PENDING")}
                                            className="px-4 py-2 rounded-lg bg-blue-500/10 text-[9px] font-black text-blue-500 uppercase hover:bg-blue-600 hover:text-white transition-all"
                                        >
                                            Assign
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Squad Status Grid */}
                <div className="col-span-12 lg:col-span-8 space-y-8">
                    <div className="glass-card border-zinc-800">
                        <div className="p-8 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/30">
                            <h3 className="text-sm font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                                <Users size={16} className="text-blue-500" /> Active_Developer_Grid
                            </h3>
                            <div className="flex gap-4">
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                                    <input className="bg-black border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-[10px] outline-none focus:border-blue-500 w-64" placeholder="Filter by Name/Skill..." />
                                </div>
                                <button className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors">
                                    <Filter size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-zinc-900/50">
                                    <tr>
                                        <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Developer</th>
                                        <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Current_Task</th>
                                        <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Velocity</th>
                                        <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Status</th>
                                        <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-900">
                                    {devs.map((dev) => (
                                        <tr key={dev.user_id} className="hover:bg-zinc-900/20 transition-colors group">
                                            <td className="p-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-black text-zinc-400 group-hover:border-blue-500/50 transition-all">
                                                        {dev.name[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold uppercase tracking-tight">{dev.name}</p>
                                                        <p className="text-[10px] text-zinc-500 font-mono italic">{dev.user_id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                {dev.current_task ? (
                                                    <div>
                                                        <p className="text-xs font-bold text-zinc-300 uppercase">{dev.current_task.title}</p>
                                                        <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest mt-1">Due_In_4D</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-zinc-700 italic">No Task Active</span>
                                                )}
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-500" style={{ width: `${(dev.performance?.wpm / 80) * 100}%` }} />
                                                    </div>
                                                    <span className="text-xs font-mono font-bold">{dev.performance?.wpm || 0}</span>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${dev.current_task ? 'bg-blue-500 animate-pulse' : 'bg-zinc-700'}`} />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                                        {dev.current_task ? 'Engaged' : 'Available'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-6 text-right">
                                                <button className="p-2 text-zinc-600 hover:text-white transition-colors">
                                                    <ChevronRight size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
