'use client';

import React, { useEffect, useState } from 'react';
import {
    Users, Plus, Search, Briefcase, Sparkles, RotateCcw,
    LogOut, Mail, Clock, Star, Shield, FileQuestion, Trash2, CheckCircle,
    ChevronDown, ChevronUp
} from 'lucide-react';
import { authApi, taskApi, analyticsApi, assessmentApi } from '@/lib/api';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

type QuestionDraft = {
    id: string;
    question: string;
    options: { A: string; B: string; C: string; D: string };
    correct_option: 'A' | 'B' | 'C' | 'D';
};

const blankQuestion = (idx: number): QuestionDraft => ({
    id: `Q${idx + 1}`,
    question: '',
    options: { A: '', B: '', C: '', D: '' },
    correct_option: 'A',
});

export default function ProjectManagerDashboard() {
    const [devs, setDevs] = useState<any[]>([]);
    const [stats, setStats] = useState({ total_devs: 0, high_risk: 0, avg_wpm: 0 });
    const [manager, setManager] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const [taskTitle, setTaskTitle] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [matchingCandidates, setMatchingCandidates] = useState(false);
    const [candidates, setCandidates] = useState<any[]>([]);
    const [matchedFor, setMatchedFor] = useState<{ title: string; description: string } | null>(null);
    const [assigningDevId, setAssigningDevId] = useState<string | null>(null);
    const [lastAssigned, setLastAssigned] = useState<{ devId: string; taskId: string } | null>(null);

    // Weekly Test State
    const [testTitle, setTestTitle] = useState('');
    const [testDomain, setTestDomain] = useState('python');
    const [questions, setQuestions] = useState<QuestionDraft[]>(
        Array.from({ length: 10 }, (_, i) => blankQuestion(i))
    );
    const [creatingTest, setCreatingTest] = useState(false);
    const [activeTests, setActiveTests] = useState<any[]>([]);
    const [testCollapsed, setTestCollapsed] = useState(true);

    useEffect(() => {
        const fetchOrgData = async () => {
            try {
                const sessionStr = localStorage.getItem('adt_user');
                if (!sessionStr) { window.location.href = '/login?role=project_manager'; return; }
                const session = JSON.parse(sessionStr);
                if (session.role !== 'manager' && session.role !== 'PM') {
                    window.location.href = '/login?role=project_manager'; return;
                }

                const mgrResp = await authApi.getProfile(session.user_id);
                setManager(mgrResp.data);

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

                const highRiskCount = devsWithPerformance.filter(d => d.performance?.learning_velocity === 'RISING').length;
                const totalWpm = devsWithPerformance.reduce((acc, d) => acc + (d.performance?.wpm || 0), 0);
                const avgWpm = devList.length > 0 ? Math.round(totalWpm / devList.length) : 0;
                setStats({ total_devs: devList.length, high_risk: highRiskCount, avg_wpm: avgWpm });

                try {
                    const testsResp = await assessmentApi.listActive();
                    setActiveTests(testsResp.data || []);
                } catch { /* ignore */ }
            } catch (e) { console.error('PM Data fetch failed', e); }
            finally { setLoading(false); }
        };
        fetchOrgData();
    }, []);

    const handleFindCandidates = async () => {
        if (!taskDescription.trim()) {
            alert('Please enter a task description first.');
            return;
        }
        setMatchingCandidates(true);
        setCandidates([]);
        setLastAssigned(null);
        try {
            const res = await taskApi.findCandidates({
                title: taskTitle.trim() || taskDescription.trim().slice(0, 60),
                description: taskDescription.trim(),
                required_skills: { python: 1.0 },
                created_by: manager?.user_id || 'system_mgr',
            });
            const list = res.data?.candidates || [];
            const squadSize = res.data?.squad_size ?? 0;
            setCandidates(list);
            setMatchedFor({ title: taskTitle.trim(), description: taskDescription.trim() });
            if (list.length === 0) {
                if (squadSize === 0) {
                    alert('No developers are currently assigned to your squad. Ask a tech admin to allocate devs to you.');
                } else {
                    alert(`Your squad has ${squadSize} dev(s) but none have a skill profile yet. They need to register and complete the Fusion audit before they can be matched.`);
                }
            }
        } catch (err: any) {
            alert('Match failed: ' + (err.response?.data?.detail || err.message));
        }
        setMatchingCandidates(false);
    };

    const handleAssignToDev = async (devId: string) => {
        if (!matchedFor) return;
        setAssigningDevId(devId);
        try {
            const session = JSON.parse(localStorage.getItem('adt_user') || '{}');
            const createRes = await taskApi.createTask({
                title: matchedFor.title || matchedFor.description.slice(0, 60),
                description: matchedFor.description,
                required_skills: { python: 1.0 },
                created_by: session.user_id || 'system_mgr',
            });
            const taskId = createRes.data.task_id;
            await taskApi.assignTask(taskId, {
                task_id: taskId,
                assigned_to: devId,
                assigned_by: session.user_id || 'system_mgr',
            });
            setLastAssigned({ devId, taskId });
            alert(`Task ${taskId} created and assigned to ${devId}.`);
            setTaskTitle('');
            setTaskDescription('');
            setCandidates([]);
            setMatchedFor(null);
        } catch (err: any) {
            alert('Assignment failed: ' + (err.response?.data?.detail || err.message));
        }
        setAssigningDevId(null);
    };

    const resetMatching = () => {
        setCandidates([]);
        setMatchedFor(null);
        setLastAssigned(null);
    };

    const updateQuestion = (idx: number, patch: Partial<QuestionDraft>) => {
        setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, ...patch } : q));
    };

    const updateOption = (idx: number, key: 'A' | 'B' | 'C' | 'D', val: string) => {
        setQuestions(prev => prev.map((q, i) =>
            i === idx ? { ...q, options: { ...q.options, [key]: val } } : q
        ));
    };

    const resetTestForm = () => {
        setTestTitle('');
        setTestDomain('python');
        setQuestions(Array.from({ length: 10 }, (_, i) => blankQuestion(i)));
    };

    const handleCreateTest = async () => {
        if (!testTitle.trim()) {
            alert('Please enter a test title.');
            return;
        }
        const incomplete = questions.find(q =>
            !q.question.trim() ||
            !q.options.A.trim() || !q.options.B.trim() ||
            !q.options.C.trim() || !q.options.D.trim()
        );
        if (incomplete) {
            alert(`Question ${incomplete.id} is incomplete. All 10 questions and their 4 options are required.`);
            return;
        }

        setCreatingTest(true);
        try {
            const session = JSON.parse(localStorage.getItem('adt_user') || '{}');
            const payload = {
                test_id: '',
                title: testTitle.trim(),
                domain: testDomain.trim().toLowerCase(),
                created_by: session.user_id || 'system_mgr',
                questions: questions.map(q => ({
                    id: q.id,
                    question: q.question.trim(),
                    options: [
                        `A) ${q.options.A.trim()}`,
                        `B) ${q.options.B.trim()}`,
                        `C) ${q.options.C.trim()}`,
                        `D) ${q.options.D.trim()}`,
                    ],
                    correct_option: q.correct_option,
                    domain: testDomain.trim().toLowerCase(),
                })),
                is_active: true,
            };
            const res = await assessmentApi.create(payload);
            alert(`Weekly test created: ${res.data.test_id}`);
            resetTestForm();
            try {
                const testsResp = await assessmentApi.listActive();
                setActiveTests(testsResp.data || []);
            } catch { /* ignore */ }
        } catch (err: any) {
            alert('Failed to create test: ' + (err.response?.data?.detail || err.message));
        }
        setCreatingTest(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('adt_user');
        document.cookie = 'adt_user=; Max-Age=0; path=/';
        window.location.href = '/login?role=project_manager';
    };

    const filteredDevs = devs.filter(d =>
        d.name?.toLowerCase().includes(search.toLowerCase()) ||
        d.user_id?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return (
        <LoadingScreen
            message="Synchronizing team intel"
            subtitle="Loading squad, velocity & active tasks"
            accent="blue"
        />
    );

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 animate-fade pb-24">

            {/* Page Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        <Users size={20} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">
                            Project Manager <span className="text-zinc-500">Panel</span>
                        </h1>
                        <p className="text-sm text-zinc-500 mt-0.5">Manage your squad, monitor velocity, and allocate tasks.</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all rounded-lg text-sm font-medium"
                >
                    <LogOut size={16} /> Logout
                </button>
            </div>

            {/* Manager Profile — Hero (kept the same, minus Avg Velocity) */}
            <div className="glass-card p-6 border-blue-500/20 bg-blue-500/5 relative overflow-hidden">
                <div className="absolute -top-16 -right-16 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="flex flex-col md:flex-row items-start gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-2xl font-bold shrink-0 border-2 border-black shadow-xl shadow-blue-500/20">
                        {manager?.name?.[0] || 'M'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                            <h2 className="text-2xl font-bold text-white">{manager?.name || 'Manager'}</h2>
                            <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                                {manager?.role || 'Project Manager'}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                            {[
                                { label: 'Operator ID', val: manager?.user_id, icon: <Shield size={11} /> },
                                { label: 'Email', val: manager?.email, icon: <Mail size={11} /> },
                                { label: 'Experience', val: manager?.experience_level || 'Senior', icon: <Star size={11} /> },
                                { label: 'Joined', val: manager?.registered_at ? new Date(manager.registered_at).toLocaleDateString() : 'N/A', icon: <Clock size={11} /> },
                                { label: 'Direct Reports', val: stats.total_devs, icon: <Users size={11} /> },
                            ].map(item => (
                                <div key={item.label} className="p-3 rounded-xl bg-black/40 border border-zinc-900">
                                    <div className="flex items-center gap-1 text-zinc-500 mb-1.5">
                                        {item.icon}
                                        <span className="text-[9px] font-bold uppercase tracking-tighter">{item.label}</span>
                                    </div>
                                    <p className="text-xs text-zinc-200 font-medium truncate">{item.val}</p>
                                </div>
                            ))}
                        </div>
                        {manager?.strong_domains?.length > 0 && (
                            <div className="mt-4 flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Focus Areas:</span>
                                {manager.strong_domains.map((d: string) => (
                                    <span key={d} className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[10px] text-zinc-400">{d}</span>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="shrink-0 text-right hidden lg:block">
                        <p className="text-[10px] text-zinc-500 mb-1">High Performers</p>
                        <p className="text-3xl font-bold text-green-400">{stats.high_risk}</p>
                        <p className="text-[10px] text-zinc-600 mt-1">velocity RISING</p>
                    </div>
                </div>
            </div>

            {/* Developers Table */}
            <div className="glass-card border-zinc-800 shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
                <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/30">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                        <Users size={14} className="text-blue-500" /> Assigned Developers
                        <span className="ml-1 px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] text-zinc-400">{devs.length}</span>
                    </h3>
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="bg-black border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs outline-none focus:border-blue-500 w-56 transition-colors"
                            placeholder="Filter by name or ID..."
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-900/50">
                            <tr>
                                <th className="p-4 text-xs text-zinc-500 font-medium">Developer</th>
                                <th className="p-4 text-xs text-zinc-500 font-medium">Top Skills</th>
                                <th className="p-4 text-xs text-zinc-500 font-medium">Global Rank</th>
                                <th className="p-4 text-xs text-zinc-500 font-medium">Velocity (WPM)</th>
                                <th className="p-4 text-xs text-zinc-500 font-medium">Impact / Hours</th>
                                <th className="p-4 text-xs text-zinc-500 font-medium">Learning Velocity</th>
                                <th className="p-4 text-xs text-zinc-500 font-medium">Current Assignment</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900">
                            {filteredDevs.length > 0 ? filteredDevs.map((dev) => (
                                <tr key={dev.user_id} className="hover:bg-zinc-900/20 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-400">
                                                {dev.name?.[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">{dev.name}</p>
                                                <p className="text-[10px] text-zinc-500">{dev.email || dev.user_id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                                            {dev.performance?.top_skills?.length > 0
                                                ? dev.performance.top_skills.map((skill: string) => (
                                                    <span key={skill} className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[10px]">
                                                        {skill}
                                                    </span>
                                                ))
                                                : <span className="text-[10px] text-zinc-600">Unknown</span>
                                            }
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-xs font-bold text-yellow-500">
                                            #{dev.performance?.overall_rank || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-green-500 rounded-full"
                                                    style={{ width: `${Math.min(100, ((dev.performance?.wpm || 0) / 80) * 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-mono font-bold text-white">
                                                {dev.performance?.wpm || 0}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <p className="text-xs font-mono text-cyan-500">{dev.performance?.lines || 0} Lines</p>
                                        <p className="text-[10px] text-zinc-500">{dev.performance?.active_hours || 0} Hrs Active</p>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-medium border ${
                                            dev.performance?.learning_velocity === 'RISING'
                                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                : dev.performance?.learning_velocity === 'STABLE'
                                                    ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                                                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                                        }`}>
                                            {dev.performance?.learning_velocity || 'Unknown'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {dev.current_task ? (
                                            <div>
                                                <p className="text-xs text-zinc-300 font-medium">{dev.current_task.title}</p>
                                                <span className="inline-block mt-1 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-400">
                                                    {dev.current_task.task_id}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-zinc-600 italic">Bench / Unassigned</span>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={7} className="p-10 text-center text-sm text-zinc-600 italic">
                                        {search ? 'No developers match your filter.' : 'No developers assigned to your squad yet.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Task Allotment — AI-Driven 2-Step Flow */}
            <div className="glass-card p-6 border-zinc-800">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                        <Briefcase size={14} className="text-blue-500" /> Allot Task
                        <span className="ml-1 px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] text-zinc-400">
                            {candidates.length > 0 ? 'Step 2: Pick Best Fit' : 'Step 1: Describe Task'}
                        </span>
                    </h3>
                    {candidates.length > 0 && (
                        <button
                            onClick={resetMatching}
                            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors"
                        >
                            <RotateCcw size={12} /> Start Over
                        </button>
                    )}
                </div>

                {/* Step 1 — Task Description Form */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2 block">
                            Task Title <span className="text-zinc-700 normal-case">(optional)</span>
                        </label>
                        <input
                            type="text"
                            value={taskTitle}
                            onChange={e => setTaskTitle(e.target.value)}
                            placeholder="e.g. Migrate Auth to Rust"
                            disabled={candidates.length > 0}
                            className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500 transition-colors placeholder:text-zinc-700 disabled:opacity-50"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2 block">
                            Task Description <span className="text-red-400 normal-case">*</span>
                        </label>
                        <input
                            type="text"
                            value={taskDescription}
                            onChange={e => setTaskDescription(e.target.value)}
                            placeholder="Describe the work — the AI uses this to vector-match the right developer..."
                            disabled={candidates.length > 0}
                            className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500 transition-colors placeholder:text-zinc-700 disabled:opacity-50"
                        />
                    </div>
                </div>

                <div className="mt-5 flex items-center justify-between">
                    <p className="text-xs text-zinc-600">
                        {candidates.length > 0
                            ? `${candidates.length} candidate(s) ranked by CSA-Matching algorithm.`
                            : 'AI will rank developers by Cosine-Similarity against the task vector.'}
                    </p>
                    {candidates.length === 0 && (
                        <button
                            onClick={handleFindCandidates}
                            disabled={!taskDescription.trim() || matchingCandidates}
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-all"
                        >
                            <Sparkles size={16} /> {matchingCandidates ? 'Matching...' : 'Find Best Devs'}
                        </button>
                    )}
                </div>

                {/* Step 2 — Candidates List */}
                {candidates.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-zinc-800 space-y-2">
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-3">
                            Ranked Candidates
                        </p>
                        {candidates.map((c, idx) => {
                            const isAssigningThis = assigningDevId === c.user_id;
                            const wasAssigned = lastAssigned?.devId === c.user_id;
                            const score = Math.round((c.match_score || 0) * 100);
                            const showXai = idx < 3 && c.explanation;
                            const exp = c.explanation;
                            const squadMatch = devs.find(d => d.user_id === c.user_id);
                            const existingTask = squadMatch?.current_task;
                            const isBusy = !!existingTask;
                            return (
                                <div
                                    key={c.user_id}
                                    className={`rounded-xl border transition-all ${
                                        wasAssigned
                                            ? 'bg-green-500/10 border-green-500/30'
                                            : showXai
                                                ? 'bg-blue-500/[0.03] border-blue-500/20'
                                                : 'bg-black/40 border-zinc-900 hover:border-zinc-700'
                                    }`}
                                >
                                    <div className="flex items-center gap-4 p-3">
                                        <span className={`w-7 text-center text-xs font-bold ${
                                            idx === 0 ? 'text-yellow-500' : idx < 3 ? 'text-blue-400' : 'text-zinc-600'
                                        }`}>
                                            #{idx + 1}
                                        </span>
                                        <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-400 shrink-0">
                                            {c.name?.[0] || '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium text-white truncate">{c.name || c.user_id}</p>
                                                {isBusy ? (
                                                    <span
                                                        title={`Already assigned: ${existingTask?.title || existingTask?.task_id}`}
                                                        className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-bold uppercase tracking-wider"
                                                    >
                                                        <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
                                                        Busy
                                                    </span>
                                                ) : (
                                                    <span className="shrink-0 px-1.5 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-400 text-[9px] font-bold uppercase tracking-wider">
                                                        Available
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-zinc-500 font-mono truncate">
                                                {c.user_id} · {c.primary_skill || 'General'}
                                                {isBusy && existingTask?.task_id && (
                                                    <span className="text-amber-500/70"> · on {existingTask.task_id}</span>
                                                )}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0 hidden sm:block">
                                            <p className="text-[10px] text-zinc-500">Match Score</p>
                                            <p className={`text-sm font-mono font-bold ${
                                                score >= 70 ? 'text-green-400' : score >= 50 ? 'text-blue-400' : 'text-zinc-500'
                                            }`}>
                                                {score}%
                                            </p>
                                        </div>
                                        <div className="w-20 h-1.5 bg-zinc-900 rounded-full overflow-hidden hidden md:block">
                                            <div
                                                className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
                                                style={{ width: `${score}%` }}
                                            />
                                        </div>
                                        {wasAssigned ? (
                                            <span className="flex items-center gap-1.5 px-3 py-2 bg-green-500/20 border border-green-500/40 text-green-400 rounded-lg text-xs font-medium shrink-0">
                                                <CheckCircle size={14} /> Assigned
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => handleAssignToDev(c.user_id)}
                                                disabled={isAssigningThis || !!assigningDevId}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-medium transition-all shrink-0"
                                            >
                                                <Plus size={14} /> {isAssigningThis ? 'Assigning...' : 'Assign'}
                                            </button>
                                        )}
                                    </div>

                                    {showXai && (
                                        <div className="px-4 pb-4 pt-0 border-t border-blue-500/10 mt-1">
                                            <div className="flex items-center gap-1.5 mb-2 mt-3">
                                                <Sparkles size={11} className="text-blue-400" />
                                                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                                                    Why the AI picked them
                                                </span>
                                            </div>
                                            <p className="text-xs text-zinc-300 leading-relaxed mb-3">
                                                {exp.rationale}
                                            </p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {exp.matched_skills?.length > 0 && (
                                                    <div>
                                                        <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mb-1.5">
                                                            Matched Skills
                                                        </p>
                                                        <div className="space-y-1">
                                                            {exp.matched_skills.slice(0, 3).map((m: any) => (
                                                                <div key={m.skill} className="flex items-center gap-2">
                                                                    <span className="text-[10px] text-zinc-400 font-mono w-20 truncate">{m.skill}</span>
                                                                    <div className="flex-1 h-1 bg-zinc-900 rounded-full overflow-hidden">
                                                                        <div
                                                                            className="h-full bg-blue-500 rounded-full"
                                                                            style={{ width: `${Math.round(m.dev_strength * 100)}%` }}
                                                                        />
                                                                    </div>
                                                                    <span className="text-[10px] font-mono text-blue-400 w-9 text-right">
                                                                        {Math.round(m.dev_strength * 100)}%
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mb-1.5">
                                                        Score Breakdown
                                                    </p>
                                                    <div className="grid grid-cols-3 gap-2 text-center">
                                                        <div className="p-2 rounded bg-black/40 border border-zinc-900">
                                                            <p className="text-[9px] text-zinc-500">Skill</p>
                                                            <p className="text-xs font-mono text-blue-400 font-bold">
                                                                {Math.round((exp.breakdown?.skill_component || 0) * 100)}%
                                                            </p>
                                                        </div>
                                                        <div className="p-2 rounded bg-black/40 border border-zinc-900">
                                                            <p className="text-[9px] text-zinc-500">Conf</p>
                                                            <p className="text-xs font-mono text-purple-400 font-bold">
                                                                {Math.round((exp.breakdown?.confidence_component || 0) * 100)}%
                                                            </p>
                                                        </div>
                                                        <div className="p-2 rounded bg-black/40 border border-zinc-900">
                                                            <p className="text-[9px] text-zinc-500">Base</p>
                                                            <p className="text-xs font-mono text-zinc-400 font-bold">
                                                                {Math.round((exp.breakdown?.baseline || 0) * 100)}%
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Weekly Test Creation */}
            <div className={`glass-card border-zinc-800 ${testCollapsed ? 'p-4' : 'p-6'} transition-all`}>
                <div className={`flex justify-between items-center ${testCollapsed ? '' : 'mb-6'}`}>
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                        <FileQuestion size={14} className="text-blue-500" /> Create Weekly Test
                        <span className="ml-1 px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] text-zinc-400">10 questions</span>
                    </h3>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] text-zinc-600">
                            Active assessments: <span className="text-blue-400 font-mono">{activeTests.length}</span>
                        </span>
                        <button
                            onClick={() => setTestCollapsed(v => !v)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white text-[10px] font-medium uppercase tracking-wider transition-all"
                            title={testCollapsed ? 'Expand' : 'Minimize'}
                        >
                            {testCollapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                            {testCollapsed ? 'Expand' : 'Minimize'}
                        </button>
                    </div>
                </div>

                {!testCollapsed && (
                <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2 block">
                            Test Title
                        </label>
                        <input
                            type="text"
                            value={testTitle}
                            onChange={e => setTestTitle(e.target.value)}
                            placeholder="e.g. Python Async Mastery — Week 18"
                            className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500 transition-colors placeholder:text-zinc-700"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2 block">
                            Skill Domain
                        </label>
                        <input
                            type="text"
                            value={testDomain}
                            onChange={e => setTestDomain(e.target.value)}
                            placeholder="e.g. python, react, system_design"
                            className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500 transition-colors placeholder:text-zinc-700"
                        />
                    </div>
                </div>

                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {questions.map((q, idx) => (
                        <div key={q.id} className="p-4 rounded-xl border border-zinc-900 bg-black/40">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                                    Question {idx + 1} <span className="text-zinc-600">/ 10</span>
                                </span>
                                <span className="text-[10px] text-zinc-600 font-mono">{q.id}</span>
                            </div>
                            <textarea
                                value={q.question}
                                onChange={e => updateQuestion(idx, { question: e.target.value })}
                                placeholder="Type the question..."
                                rows={2}
                                className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500 transition-colors placeholder:text-zinc-700 mb-3 resize-none"
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                                {(['A', 'B', 'C', 'D'] as const).map(key => (
                                    <div key={key} className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => updateQuestion(idx, { correct_option: key })}
                                            className={`w-7 h-7 shrink-0 rounded-md text-[10px] font-bold border transition-all ${
                                                q.correct_option === key
                                                    ? 'bg-green-500/20 border-green-500/50 text-green-400'
                                                    : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                                            }`}
                                            title={q.correct_option === key ? 'Marked correct' : 'Mark as correct'}
                                        >
                                            {key}
                                        </button>
                                        <input
                                            type="text"
                                            value={q.options[key]}
                                            onChange={e => updateOption(idx, key, e.target.value)}
                                            placeholder={`Option ${key}`}
                                            className="flex-1 bg-black border border-zinc-800 rounded-md px-2 py-1.5 text-xs text-white outline-none focus:border-blue-500 transition-colors placeholder:text-zinc-700"
                                        />
                                    </div>
                                ))}
                            </div>
                            <p className="text-[10px] text-zinc-600">
                                Correct answer: <span className="text-green-400 font-mono">{q.correct_option}</span>
                            </p>
                        </div>
                    ))}
                </div>

                <div className="mt-5 flex items-center justify-between">
                    <button
                        onClick={resetTestForm}
                        className="flex items-center gap-2 px-4 py-2 text-zinc-500 hover:text-white text-xs"
                    >
                        <Trash2 size={14} /> Reset
                    </button>
                    <button
                        onClick={handleCreateTest}
                        disabled={creatingTest}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-all"
                    >
                        <Plus size={16} /> {creatingTest ? 'Creating...' : 'Publish Weekly Test'}
                    </button>
                </div>
                </>
                )}
            </div>

        </div>
    );
}
