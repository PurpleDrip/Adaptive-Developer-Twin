'use client';

import React, { useEffect, useState } from 'react';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer
} from 'recharts';
import {
    Award, Zap, Clock, Code, Bell, CheckCircle,
    Briefcase, User, ChevronRight, TrendingUp, Activity
} from 'lucide-react';
import { thgApi, authApi, taskApi, analyticsApi } from '@/lib/api';

export default function DeveloperDashboard() {
    const [skills, setSkills] = useState([]);
    const [metrics, setMetrics] = useState({
        wpm: 0, active_hours: 0, lines: 0,
        rank: 0, percentile: 0, velocity: "STABLE", top_skill: "None"
    });
    const [task, setTask] = useState<any>(null);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const sessionStr = localStorage.getItem('adt_user');
                if (!sessionStr) { window.location.href = '/login?role=developer'; return; }
                const session = JSON.parse(sessionStr);
                const userId = session.user_id;

                // 1. Skills from THG
                try {
                    const skillResp = await thgApi.getSkills(userId);
                    setSkills(skillResp.data.skills.map((s: any) => ({
                        subject: s.name, A: Math.round(s.strength * 100)
                    })));
                } catch { console.warn('Skills not available yet'); }

                // 2. User Profile
                try {
                    const userResp = await authApi.getProfile(userId);
                    setUser(userResp.data);
                } catch { setUser({ name: session.name, user_id: userId }); }

                // 3. Allotted Task
                try {
                    const taskResp = await taskApi.getUserTasks(userId);
                    if (taskResp.data.length > 0) setTask(taskResp.data[0]);
                } catch { console.warn('Tasks not available'); }

                // 4. Leaderboard
                try {
                    const lbResp = await analyticsApi.getLeaderboard('Python');
                    setLeaderboard(lbResp.data);
                } catch { console.warn('Leaderboard not available'); }

                // 5. Notifications
                try {
                    const notifResp = await authApi.getNotifications(userId);
                    setNotifications(notifResp.data);
                } catch { setNotifications([]); }

                // 6. Analytics Summary
                try {
                    const statsResp = await analyticsApi.getSummary(userId);
                    const s = statsResp.data;
                    setMetrics({
                        wpm: s.wpm, active_hours: s.active_hours, lines: s.lines,
                        rank: s.overall_rank, percentile: s.overall_rank_percentile,
                        velocity: s.learning_velocity, top_skill: s.top_skills?.[0] || "Backend"
                    });
                } catch { console.warn('Analytics not available — not enough data'); }

            } catch (e) { console.error("Dashboard sync failed", e); }
            finally { setLoading(false); }
        };
        fetchData();
    }, []);

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="flex items-center gap-3 text-blue-500">
                <Activity size={20} className="animate-pulse" />
                <span className="text-sm font-medium">Synchronizing your neural twin...</span>
            </div>
        </div>
    );

    return (
        <div className="max-w-[1400px] mx-auto p-6 lg:p-8 space-y-6 animate-fade">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <Zap size={16} className="text-white" />
                        </div>
                        <span className="text-xs text-zinc-500 font-medium">Adaptive Developer Twin</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white">
                        Welcome back, <span className="text-blue-500">{user?.name || "Developer"}</span>
                    </h1>
                    <p className="text-sm text-zinc-500 mt-1">Your neural twin is active and tracking progress.</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-zinc-500 mb-1">Global Rank</p>
                    <p className="text-3xl font-bold text-white">#{metrics.rank || "—"}</p>
                    <p className="text-xs text-green-500">Top {metrics.percentile || 0}%</p>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Active Hours', val: metrics.active_hours + 'h', icon: <Clock size={18} />, color: 'blue' },
                    { label: 'Code Velocity', val: metrics.wpm + ' wpm', icon: <Zap size={18} />, color: 'purple' },
                    { label: 'Impact Score', val: metrics.lines, icon: <Code size={18} />, color: 'green' }
                ].map((stat) => (
                    <div key={stat.label} className="glass-card p-5 border-zinc-800 flex items-center gap-4 hover:border-zinc-700 transition-all">
                        <div className={`w-10 h-10 rounded-xl bg-${stat.color}-500/10 flex items-center justify-center text-${stat.color}-500`}>
                            {stat.icon}
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500">{stat.label}</p>
                            <p className="text-xl font-bold text-white">{stat.val}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Left Column */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                    {/* Skill Radar */}
                    <div className="glass-card p-6 border-zinc-800">
                        <h3 className="text-sm font-semibold text-zinc-400 mb-4 flex items-center gap-2">
                            <TrendingUp size={14} className="text-blue-500" /> Skill Matrix
                        </h3>
                        {skills.length > 0 ? (
                            <div className="h-[260px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skills}>
                                        <PolarGrid stroke="#262626" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#71717a', fontSize: 11 }} />
                                        <Radar name="Skills" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-[260px] flex items-center justify-center text-sm text-zinc-600 italic">
                                Not enough data available to judge
                            </div>
                        )}
                        <div className="mt-4 pt-4 border-t border-zinc-800 grid grid-cols-2 gap-3 text-xs">
                            <div>
                                <span className="text-zinc-500 block mb-0.5">Strongest Domain</span>
                                <span className="text-blue-400 font-semibold">{metrics.top_skill}</span>
                            </div>
                            <div>
                                <span className="text-zinc-500 block mb-0.5">Velocity</span>
                                <span className={`font-semibold ${metrics.velocity === 'RISING' ? 'text-green-500' : 'text-zinc-400'}`}>
                                    {metrics.velocity}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Leaderboard */}
                    <div className="glass-card p-6 border-zinc-800">
                        <h3 className="text-sm font-semibold text-zinc-400 mb-4 flex items-center gap-2">
                            <Award size={14} className="text-yellow-500" /> Global Leaderboard
                        </h3>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                            {leaderboard.length > 0 ? leaderboard.map((entry, idx) => (
                                <div key={entry.dev_id} className={`flex items-center gap-3 p-3 rounded-xl border ${
                                    entry.dev_id === user?.user_id
                                        ? 'bg-blue-500/10 border-blue-500/30'
                                        : 'bg-black/30 border-zinc-900'
                                } hover:border-zinc-700 transition-all`}>
                                    <span className={`w-5 text-xs font-bold ${idx < 3 ? 'text-yellow-500' : 'text-zinc-600'}`}>
                                        {idx + 1}
                                    </span>
                                    <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-bold">
                                        {entry.name?.[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-white truncate">{entry.name}</p>
                                    </div>
                                    <span className="text-xs font-mono text-blue-500">
                                        {(entry.composite_score * 100).toFixed(0)}%
                                    </span>
                                </div>
                            )) : (
                                <p className="text-xs text-zinc-600 italic text-center py-8">No leaderboard data yet</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="col-span-12 lg:col-span-8 space-y-6">
                    {/* Current Task */}
                    <div className="glass-card border-zinc-800 overflow-hidden">
                        <div className="p-5 border-b border-zinc-800 bg-zinc-900/30 flex justify-between items-center">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                                <Briefcase size={14} className="text-blue-500" /> Current Assignment
                            </h3>
                            {task && (
                                <span className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-[10px] font-medium text-blue-400">
                                    {task.status?.replace('_', ' ')}
                                </span>
                            )}
                        </div>
                        <div className="p-6">
                            {task ? (
                                <div className="grid grid-cols-12 gap-6">
                                    <div className="col-span-12 lg:col-span-8 space-y-3">
                                        <h4 className="text-xl font-bold text-white">{task.title}</h4>
                                        <p className="text-sm text-zinc-500 leading-relaxed">{task.description}</p>
                                        <div className="flex gap-2 pt-2">
                                            {Object.keys(task.required_skills || {}).map(skill => (
                                                <span key={skill} className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-400">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="col-span-12 lg:col-span-4">
                                        <div className="p-4 rounded-xl bg-black border border-zinc-800">
                                            <p className="text-[10px] text-zinc-500 mb-3">Assigned By</p>
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                                                    <User size={16} className="text-blue-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-white">Project Manager</p>
                                                    <p className="text-[10px] text-blue-500">Engineering Lead</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-10 text-center space-y-3">
                                    <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-700">
                                        <Briefcase size={22} />
                                    </div>
                                    <p className="text-sm text-zinc-600 italic">Standby mode — no task currently allotted.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Notifications */}
                    <div className="glass-card p-6 border-zinc-800">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-sm font-semibold text-zinc-400 flex items-center gap-2">
                                <Bell size={14} className="text-blue-500" /> Notifications
                            </h3>
                        </div>
                        <div className="space-y-3">
                            {notifications.length > 0 ? notifications.map((notif) => (
                                <div key={notif.notification_id} className={`p-4 rounded-xl border ${
                                    notif.is_read ? 'bg-black/20 border-zinc-900' : 'bg-blue-500/5 border-blue-500/20'
                                } flex items-start gap-3`}>
                                    <div className={`mt-0.5 ${notif.type === 'task_allotted' ? 'text-blue-500' : 'text-green-500'}`}>
                                        {notif.type === 'task_allotted' ? <Briefcase size={14} /> : <CheckCircle size={14} />}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-xs font-semibold text-white">{notif.title}</h4>
                                        <p className="text-[11px] text-zinc-500 mt-0.5">{notif.message}</p>
                                    </div>
                                    {!notif.is_read && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />}
                                </div>
                            )) : (
                                <div className="py-10 text-center text-zinc-700 text-xs italic">
                                    All clear — no new notifications.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
