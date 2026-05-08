'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, 
    AreaChart, Area, XAxis, Tooltip, BarChart, Bar, YAxis
} from 'recharts';
import { 
    Award, Zap, Clock, Code, Bell, CheckCircle, 
    AlertCircle, Briefcase, User, ChevronRight, TrendingUp 
} from 'lucide-react';
import { thgApi, authApi, taskApi, analyticsApi } from '@/lib/api';

export default function DeveloperDashboard() {
    const [skills, setSkills] = useState([]);
    const [metrics, setMetrics] = useState({ 
        wpm: 0, 
        active_hours: 0, 
        lines: 0,
        rank: 0,
        percentile: 0,
        velocity: "STABLE",
        top_skill: "NONE"
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
                if (!sessionStr) {
                    window.location.href = '/login?role=developer';
                    return;
                }
                const session = JSON.parse(sessionStr);
                const userId = session.user_id; 
                
                // 1. Fetch Skills (THG)
                const skillResp = await thgApi.getSkills(userId);
                setSkills(skillResp.data.skills.map((s: any) => ({ 
                    subject: s.name.toUpperCase(), 
                    A: s.strength * 100
                })));
                
                // 2. Fetch User Profile
                const userResp = await authApi.getProfile(userId);
                setUser(userResp.data);

                // 3. Fetch Allotted Task
                const taskResp = await taskApi.getUserTasks(userId);
                if (taskResp.data.length > 0) setTask(taskResp.data[0]);

                // 4. Fetch Leaderboard (Global)
                const lbResp = await analyticsApi.getLeaderboard('backend');
                setLeaderboard(lbResp.data);

                // 5. Fetch Notifications
                const notifResp = await authApi.getNotifications(userId);
                setNotifications(notifResp.data);

                // 6. Fetch Stats (Real Analytics)
                const statsResp = await analyticsApi.getSummary(userId);
                const sData = statsResp.data;
                setMetrics({ 
                    wpm: sData.wpm, 
                    active_hours: sData.active_hours, 
                    lines: sData.lines,
                    rank: sData.overall_rank,
                    percentile: sData.overall_rank_percentile,
                    velocity: sData.learning_velocity,
                    top_skill: sData.top_skills[0] || "Backend"
                });

            } catch (e) {
                console.error("Dashboard Data Sync Failed", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center font-mono text-blue-500 animate-pulse uppercase tracking-[0.5em]">
            Synchronizing_Neural_Twin...
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto p-8 space-y-8 animate-fade">
            {/* Header Section */}
            <div className="flex justify-between items-end mb-12">
                <div>
                    <div className="flex items-center gap-3 mb-2 text-blue-500">
                        <Zap size={18} fill="currentColor" />
                        <span className="text-xs font-bold uppercase tracking-[0.4em]">Developer_Command_Center</span>
                    </div>
                    <h1 className="text-5xl font-black uppercase italic tracking-tighter">
                        {user?.name || "Developer"} <span className="text-zinc-700">/ ADT</span>
                    </h1>
                </div>
                <div className="flex gap-4">
                    <div className="text-right">
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Global_Rank</p>
                        <p className="text-3xl font-black text-white italic">#{metrics.rank || "???"} <span className="text-sm text-green-500 not-italic">▲{Math.floor(Math.random() * 5)}</span></p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* Left Column: Skill Matrix & Leaderboard */}
                <div className="col-span-12 lg:col-span-4 space-y-8">
                    {/* Skill Radar */}
                    <div className="glass-card p-8 border-zinc-800 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <TrendingUp size={80} />
                        </div>
                        <h3 className="text-sm font-bold uppercase tracking-[0.2em] mb-8 text-zinc-400">Skill_Domain_Matrix</h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skills}>
                                    <PolarGrid stroke="#262626" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold' }} />
                                    <Radar name="Skills" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-6 pt-6 border-t border-zinc-800 grid grid-cols-2 gap-4 text-[10px]">
                            <div>
                                <span className="text-zinc-500 block uppercase mb-1 font-bold">Strongest_Domain</span>
                                <span className="text-blue-400 font-black uppercase tracking-wider">{metrics.top_skill}</span>
                            </div>
                            <div>
                                <span className="text-zinc-500 block uppercase mb-1 font-bold">Percentile_Rank</span>
                                <span className="text-green-500 font-black tracking-wider">Top {metrics.percentile}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Leaderboard Module */}
                    <div className="glass-card p-8 border-zinc-800">
                        <h3 className="text-sm font-bold uppercase tracking-[0.2em] mb-8 text-zinc-400 flex items-center gap-2">
                            <Award size={16} className="text-yellow-500" /> Global_Leaderboard
                        </h3>
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {leaderboard.map((entry, idx) => (
                                <div key={entry.dev_id} className={`flex items-center gap-4 p-3 rounded-xl border ${entry.dev_id === user?.user_id ? 'bg-blue-500/10 border-blue-500/30' : 'bg-black/40 border-zinc-900'} hover:border-zinc-700 transition-all group`}>
                                    <span className={`w-6 text-xs font-black ${idx < 3 ? 'text-yellow-500' : 'text-zinc-600'}`}>0{idx + 1}</span>
                                    <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-bold uppercase">
                                        {entry.name[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-white truncate uppercase">{entry.name}</p>
                                        <p className="text-[9px] text-zinc-500 uppercase tracking-tighter">Backend_Engineer</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-mono font-black text-blue-500">{(entry.composite_score * 100).toFixed(1)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Task HUD & Notifications */}
                <div className="col-span-12 lg:col-span-8 space-y-8">
                    {/* Top Stats Row */}
                    <div className="grid grid-cols-3 gap-6">
                        {[
                            { label: 'Active_Hours', val: metrics.active_hours + 'H', icon: <Clock size={20} />, color: 'blue' },
                            { label: 'Code_Velocity', val: metrics.wpm, icon: <Zap size={20} />, color: 'purple' },
                            { label: 'Impact_Score', val: metrics.lines, icon: <Code size={20} />, color: 'green' }
                        ].map((stat) => (
                            <div key={stat.label} className="glass-card p-6 border-zinc-800 flex items-center gap-6 group hover:border-zinc-700 transition-all">
                                <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-500/10 flex items-center justify-center text-${stat.color}-500 group-hover:scale-110 transition-transform`}>
                                    {stat.icon}
                                </div>
                                <div>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{stat.label}</p>
                                    <p className="text-2xl font-black text-white">{stat.val}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Allotted Task HUD */}
                    <div className="glass-card p-0 border-zinc-800 overflow-hidden">
                        <div className="p-8 border-b border-zinc-800 bg-zinc-900/30 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Briefcase className="text-blue-500" size={20} />
                                <h3 className="text-sm font-bold uppercase tracking-[0.2em]">Current_Assignment</h3>
                            </div>
                            {task && (
                                <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-[9px] font-black text-blue-400 uppercase tracking-widest">
                                    {task.status.replace('_', ' ')}
                                </div>
                            )}
                        </div>
                        <div className="p-8 grid grid-cols-12 gap-8">
                            {task ? (
                                <>
                                    <div className="col-span-12 lg:col-span-8 space-y-4">
                                        <h4 className="text-2xl font-black uppercase italic tracking-tight">{task.title}</h4>
                                        <p className="text-sm text-zinc-500 leading-relaxed max-w-2xl">{task.description}</p>
                                        <div className="flex gap-3 pt-4">
                                            {Object.keys(task.required_skills || {}).map(skill => (
                                                <span key={skill} className="px-3 py-1 rounded bg-black border border-zinc-800 text-[10px] font-bold text-zinc-400 uppercase">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="col-span-12 lg:col-span-4 space-y-6">
                                        <div className="p-6 rounded-2xl bg-black border border-zinc-800 group hover:border-blue-500/30 transition-all cursor-pointer">
                                            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mb-4">Assigned_By</p>
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                                                    <User size={18} className="text-blue-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white uppercase">Project Manager</p>
                                                    <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest mt-0.5">Engineering_Lead</p>
                                                </div>
                                            </div>
                                        </div>
                                        <button className="w-full btn-large bg-blue-600 font-black uppercase tracking-[0.2em] italic text-sm">
                                            Open_Repository
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="col-span-12 py-12 text-center space-y-4">
                                    <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-700">
                                        <Briefcase size={24} />
                                    </div>
                                    <p className="text-sm text-zinc-600 italic">Standby Mode: No task currently allotted.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Notifications Feed */}
                    <div className="glass-card p-8 border-zinc-800">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
                                <Bell size={16} className="text-blue-500" /> Command_Notifications
                            </h3>
                            <button className="text-[10px] font-bold text-zinc-600 uppercase hover:text-white transition-colors">Mark_All_Read</button>
                        </div>
                        <div className="space-y-4">
                            {notifications.length > 0 ? (
                                notifications.map((notif) => (
                                    <div key={notif.notification_id} className={`p-5 rounded-2xl border ${notif.is_read ? 'bg-black/20 border-zinc-900' : 'bg-blue-500/5 border-blue-500/20'} flex items-start gap-4 group hover:border-zinc-700 transition-all`}>
                                        <div className={`mt-1 ${notif.type === 'task_allotted' ? 'text-blue-500' : 'text-green-500'}`}>
                                            {notif.type === 'task_allotted' ? <Briefcase size={16} /> : <CheckCircle size={16} />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="text-xs font-bold text-white uppercase">{notif.title}</h4>
                                                <span className="text-[9px] text-zinc-600 font-mono font-bold">14:02_UTC</span>
                                            </div>
                                            <p className="text-[11px] text-zinc-500 leading-relaxed">{notif.message}</p>
                                        </div>
                                        {!notif.is_read && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shadow-[0_0_10px_#3b82f6]" />}
                                    </div>
                                ))
                            ) : (
                                <div className="py-12 text-center text-zinc-700 text-xs italic">
                                    Signal clear. No new commands.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
