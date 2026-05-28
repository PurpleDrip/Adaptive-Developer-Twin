'use client';

import { useEffect, useState } from 'react';
import {
    Zap, Clock, Code, Bell, CheckCircle,
    Briefcase, User, TrendingUp, BookOpen, X, ChevronRight, Award, LogOut
} from 'lucide-react';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer
} from 'recharts';
import { thgApi, authApi, taskApi, analyticsApi, assessmentApi } from '@/lib/api';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

// Safely extract array response, return empty array on error
const safeArray = (data: any): any[] => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.detail)) return []; // Pydantic error format
    return [];
};

// Safely extract object response, return null on error
const safeObject = (data: any): any => {
    if (!data) return null;
    if (typeof data !== 'object') return null;
    if (data?.type && data?.loc && data?.msg) return null; // Pydantic error format
    return data;
};

export default function DeveloperDashboard() {
    const [skills, setSkills] = useState<any[]>([]);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [metrics, setMetrics] = useState({
        wpm: 0, active_hours: 0, lines: 0,
        rank: 0, percentile: 0, velocity: 'STABLE', top_skill: 'None'
    });
    const [task, setTask] = useState<any>(null);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const [manager, setManager] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [tests, setTests] = useState<any[]>([]);
    const [mySubmissions, setMySubmissions] = useState<Record<string, any>>({});
    const [takingTest, setTakingTest] = useState<any>(null);
    const [testAnswers, setTestAnswers] = useState<Record<string, string>>({});
    const [testSubmitting, setTestSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const sessionStr = localStorage.getItem('adt_user');
                if (!sessionStr) { window.location.replace('/login?role=developer'); return; }
                const session = JSON.parse(sessionStr);
                if (session.role === 'manager' || session.role === 'PM') {
                    window.location.href = '/project-manager'; return;
                }
                const userId = session.user_id;

                try {
                    const userResp = await authApi.getProfile(userId);
                    const userData = safeObject(userResp.data);
                    if (userData?.user_id) setUser(userData);

                    const mgrRelResp = await thgApi.getManagerForDev(userId);
                    const mgrRel = safeObject(mgrRelResp.data);
                    if (mgrRel?.manager_id) {
                        const mgrProfile = await authApi.getProfile(mgrRel.manager_id);
                        const mgrData = safeObject(mgrProfile.data);
                        if (mgrData?.user_id) setManager(mgrData);
                    }
                } catch { setUser({ name: session.name, user_id: userId }); }

                try {
                    const taskResp = await taskApi.getUserTasks(userId);
                    const tasks = safeArray(taskResp.data);
                    if (tasks.length > 0) setTask(tasks[0]);
                } catch { console.warn('Tasks not available'); }

                try {
                    const notifResp = await authApi.getNotifications(userId);
                    setNotifications(safeArray(notifResp.data));
                } catch { setNotifications([]); }

                let selfCompositeScore = 0;
                let selfRank = 0;
                try {
                    const statsResp = await analyticsApi.getSummary(userId);
                    const s = safeObject(statsResp.data);
                    if (s?.wpm !== undefined) {
                        selfRank = s.overall_rank ?? 0;
                        setMetrics({
                            wpm: s.wpm, active_hours: s.active_hours, lines: s.lines,
                            rank: selfRank, percentile: s.overall_rank_percentile,
                            velocity: s.learning_velocity, top_skill: s.top_skills?.[0] || 'Backend'
                        });
                        selfCompositeScore = (s.overall_rank_percentile ?? 0) / 100;
                    }
                } catch { console.warn('Analytics not available'); }

                try {
                    const skillResp = await thgApi.getSkills(userId);
                    const skillData = safeObject(skillResp.data);
                    if (Array.isArray(skillData?.skills)) {
                        setSkills(skillData.skills.map((s: any) => ({
                            subject: s.name, A: Math.round(s.strength * 100)
                        })));
                    }
                } catch { console.warn('Skills not available'); }

                try {
                    const lbResp = await analyticsApi.getLeaderboard('Python');
                    const lb: any[] = safeArray(lbResp.data);
                    const top10 = lb.slice(0, 10);

                    const selfIdx = top10.findIndex((e: any) => e.dev_id === userId);
                    if (selfIdx !== -1) {
                        // In top 10 — tag in place, rank is their position
                        top10[selfIdx] = { ...top10[selfIdx], isSelf: true };
                        setLeaderboard(top10);
                    } else {
                        // Not in top 10 — find rank from full list or fall back to analytics rank
                        const fullIdx = lb.findIndex((e: any) => e.dev_id === userId);
                        const actualRank = fullIdx !== -1 ? fullIdx + 1 : (selfRank > 0 ? selfRank : null);
                        const selfEntry = {
                            dev_id: userId,
                            name: session.name,
                            composite_score: selfCompositeScore,
                            isSelf: true,
                            isSelfBelow: true,  // render below separator
                            rank: actualRank,
                        };
                        setLeaderboard([...top10, selfEntry]);
                    }
                } catch { console.warn('Leaderboard not available'); }

                try {
                    const testsResp = await assessmentApi.listActive();
                    const testsList = safeArray(testsResp.data);
                    setTests(testsList);

                    const subsResp = await assessmentApi.getMySubmissions(userId);
                    const subsList = safeArray(subsResp.data);
                    const subMap: Record<string, any> = {};
                    for (const sub of subsList) {
                        if (sub?.test_id) subMap[sub.test_id] = sub;
                    }
                    setMySubmissions(subMap);
                } catch { console.warn('Tests not available'); }

            } catch (e) { console.error('Dashboard sync failed', e); }
            finally { setLoading(false); }
        };
        fetchData();
    }, []);

    const handleSubmitTest = async () => {
        if (!takingTest || !user) return;
        setTestSubmitting(true);
        try {
            const resp = await assessmentApi.submit({
                test_id: takingTest.test_id,
                user_id: user.user_id,
                answers: testAnswers,
            });
            setMySubmissions(prev => ({
                ...prev,
                [takingTest.test_id]: { score: resp.data.score, test_id: takingTest.test_id }
            }));
            setTakingTest(null);
            setTestAnswers({});
        } catch (e: any) {
            alert(e?.response?.data?.detail || 'Submission failed.');
        } finally {
            setTestSubmitting(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('adt_user');
        document.cookie = 'adt_user=; Max-Age=0; path=/';
        window.location.replace('/login');
    };

    if (loading) return (
        <LoadingScreen
            message="Synchronizing your neural twin"
            subtitle="Pulling skills, telemetry & assignments"
            accent="blue"
        />
    );

    return (
        <div className="max-w-[1400px] mx-auto space-y-6 animate-fade">

            {/* ── Page Header ── */}
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <Zap size={16} className="text-white" />
                        </div>
                        <span className="text-xs text-zinc-500 font-medium">Adaptive Developer Twin</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white">
                        Welcome back, <span className="text-blue-500">{user?.name || 'Developer'}</span>
                    </h1>
                    <p className="text-sm text-zinc-500 mt-1 flex items-center gap-2">
                        Your neural twin is active.
                        {manager && (
                            <span className="flex items-center gap-1 bg-zinc-800/50 px-2 py-0.5 rounded text-xs text-blue-400">
                                <User size={12} /> Managed by: {manager.name}
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-xs text-zinc-500 mb-1">Global Rank</p>
                        <p className="text-3xl font-bold text-white">#{metrics.rank || '—'}</p>
                        <p className="text-xs text-green-500">Top {metrics.percentile || 0}%</p>
                    </div>
                    <button
                        onClick={logout}
                        className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all rounded-lg text-xs font-medium"
                    >
                        <LogOut size={13} /> Logout
                    </button>
                </div>
            </div>

            {/* ── Stats Row ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Active Hours', val: metrics.active_hours + 'h', icon: <Clock size={18} />, color: 'blue' },
                    { label: 'Code Velocity', val: metrics.wpm + ' wpm', icon: <Zap size={18} />, color: 'purple' },
                    { label: 'Impact Score', val: metrics.lines, icon: <Code size={18} />, color: 'green' },
                    { label: 'Top Skill', val: metrics.top_skill, icon: <TrendingUp size={18} />, color: 'yellow' },
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

            {/* ── Main Grid ── */}
            <div className="grid grid-cols-12 gap-6">

                {/* Left Column */}
                <div className="col-span-12 lg:col-span-4 space-y-6">

                    {/* Skill Matrix */}
                    <div className="glass-card p-6 border-zinc-800">
                        <h3 className="text-sm font-semibold text-zinc-400 mb-4 flex items-center gap-2">
                            <TrendingUp size={14} className="text-blue-500" /> Skill Matrix
                        </h3>
                        {skills.length > 0 ? (
                            <div className="h-[240px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skills}>
                                        <PolarGrid stroke="#262626" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#71717a', fontSize: 11 }} />
                                        <Radar name="Skills" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-[240px] flex items-center justify-center text-sm text-zinc-600 italic">
                                Not enough data available yet
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
                        <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
                            {leaderboard.length > 0 ? leaderboard.map((entry, idx) => (
                                <div key={entry.dev_id}>
                                    {entry.isSelfBelow && (
                                        <div className="flex items-center gap-2 py-2">
                                            <div className="flex-1 border-t border-dashed border-zinc-800" />
                                            <span className="text-[10px] text-zinc-600 shrink-0">your position</span>
                                            <div className="flex-1 border-t border-dashed border-zinc-800" />
                                        </div>
                                    )}
                                    <div className={`flex items-center gap-3 p-2.5 rounded-xl border ${
                                        entry.isSelf
                                            ? 'bg-blue-500/10 border-blue-500/30'
                                            : 'bg-black/30 border-zinc-900'
                                    } hover:border-zinc-700 transition-all`}>
                                        <span className={`w-6 text-xs font-bold shrink-0 ${
                                            entry.isSelfBelow
                                                ? 'text-blue-400'
                                                : idx < 3 ? 'text-yellow-500' : 'text-zinc-600'
                                        }`}>
                                            {entry.isSelfBelow
                                                ? (entry.rank ? `#${entry.rank}` : '—')
                                                : idx + 1}
                                        </span>
                                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-[9px] font-bold shrink-0 ${
                                            entry.isSelf ? 'bg-blue-600 border-blue-400' : 'bg-zinc-800 border-zinc-700'
                                        }`}>
                                            {entry.name?.[0]}
                                        </div>
                                        <p className="text-xs font-medium text-white truncate flex-1">{entry.name}</p>
                                        {entry.isSelf && (
                                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 shrink-0">
                                                YOU
                                            </span>
                                        )}
                                        <span className="text-xs font-mono text-blue-500 shrink-0">
                                            {((entry.composite_score ?? entry.strength ?? 0) * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-xs text-zinc-600 italic text-center py-8">No leaderboard data yet</p>
                            )}
                        </div>
                    </div>

                </div>
                {/* /Left Column */}

                {/* Right Column */}
                <div className="col-span-12 lg:col-span-8 space-y-6">

                    {/* Current Assignment */}
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
                        <div className="p-5">
                            {task ? (
                                <div className="space-y-3">
                                    <h4 className="text-lg font-bold text-white">{task.title}</h4>
                                    <p className="text-sm text-zinc-500 leading-relaxed">{task.description}</p>
                                    <div className="flex gap-2 pt-1 flex-wrap items-center">
                                        {Object.keys(task.required_skills || {}).map(skill => (
                                            <span key={skill} className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-400">
                                                {skill}
                                            </span>
                                        ))}
                                        <span className="ml-auto text-[10px] text-zinc-600 flex items-center gap-1">
                                            <User size={10} /> {manager?.name || 'Project Manager'}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-8 text-center space-y-3">
                                    <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-700">
                                        <Briefcase size={20} />
                                    </div>
                                    <p className="text-sm text-zinc-600 italic">Standby mode — no task currently allotted.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Notifications + Tests */}
                    <div className="grid grid-cols-12 gap-6">

                        {/* Notifications */}
                        <div className="col-span-12 md:col-span-5 glass-card p-6 border-zinc-800">
                            <h3 className="text-sm font-semibold text-zinc-400 flex items-center gap-2 mb-5">
                                <Bell size={14} className="text-blue-500" /> Notifications
                            </h3>
                            <div className="space-y-3 max-h-[360px] overflow-y-auto custom-scrollbar">
                                {notifications.length > 0 ? notifications.map((notif) => (
                                    <div key={notif.notification_id} className={`p-3 rounded-xl border ${
                                        notif.is_read ? 'bg-black/20 border-zinc-900' : 'bg-blue-500/5 border-blue-500/20'
                                    } flex items-start gap-3`}>
                                        <div className={`mt-0.5 shrink-0 ${notif.type === 'task_allotted' ? 'text-blue-500' : 'text-green-500'}`}>
                                            {notif.type === 'task_allotted' ? <Briefcase size={13} /> : <CheckCircle size={13} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-xs font-semibold text-white">{notif.title}</h4>
                                            <p className="text-[11px] text-zinc-500 mt-0.5">{notif.message}</p>
                                        </div>
                                        {!notif.is_read && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />}
                                    </div>
                                )) : (
                                    <div className="py-10 text-center text-zinc-700 text-xs italic">
                                        All clear — no new notifications.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Weekly Tests */}
                        <div className="col-span-12 md:col-span-7 glass-card p-6 border-zinc-800">
                            <h3 className="text-sm font-semibold text-zinc-400 flex items-center gap-2 mb-5">
                                <BookOpen size={14} className="text-purple-500" /> Weekly Assessments
                            </h3>
                            <div className="space-y-3 max-h-[360px] overflow-y-auto custom-scrollbar">
                                {tests.length > 0 ? tests.map((test) => {
                                    const submission = mySubmissions[test.test_id];
                                    const score = submission?.score;
                                    return (
                                        <div key={test.test_id} className="p-4 rounded-xl border border-zinc-800 bg-black/30 hover:border-zinc-700 transition-all">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-white truncate">{test.title}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 font-mono">
                                                            {test.domain}
                                                        </span>
                                                        <span className="text-[10px] text-zinc-600">{test.questions?.length || 10} questions</span>
                                                    </div>
                                                    {score !== undefined && (
                                                        <div className="mt-2 flex items-center gap-2">
                                                            <div className={`text-xs font-bold px-2 py-0.5 rounded ${
                                                                score >= 0.7 ? 'bg-green-500/15 text-green-400' :
                                                                score >= 0.5 ? 'bg-yellow-500/15 text-yellow-400' :
                                                                'bg-red-500/15 text-red-400'
                                                            }`}>
                                                                Score: {Math.round(score * 100)}%
                                                            </div>
                                                            <span className="text-[10px] text-zinc-600">Neural twin updated</span>
                                                        </div>
                                                    )}
                                                </div>
                                                {score === undefined ? (
                                                    <button
                                                        onClick={() => { setTakingTest(test); setTestAnswers({}); }}
                                                        className="ml-4 flex items-center gap-1.5 px-3 py-2 bg-purple-600/20 border border-purple-500/30 text-purple-400 hover:bg-purple-600 hover:text-white hover:border-purple-500 transition-all rounded-lg text-xs font-medium shrink-0"
                                                    >
                                                        Take Test <ChevronRight size={12} />
                                                    </button>
                                                ) : (
                                                    <span className="ml-4 text-[10px] text-zinc-600 italic shrink-0">Completed</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="py-10 text-center text-zinc-700 text-xs italic">
                                        No active assessments from your manager yet.
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                    {/* /Notifications + Tests */}

                </div>
                {/* /Right Column */}

            </div>
            {/* /Main Grid */}

            {/* ── Test Modal ── */}
            {takingTest && (
                <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="glass-card w-full max-w-2xl max-h-[90vh] flex flex-col border-zinc-700">

                        <div className="p-6 border-b border-zinc-800 flex justify-between items-start shrink-0">
                            <div>
                                <h3 className="text-lg font-bold text-white">{takingTest.title}</h3>
                                <p className="text-xs text-zinc-500 mt-1">
                                    Domain: {takingTest.domain} · {takingTest.questions?.length} questions · One attempt only
                                </p>
                            </div>
                            <button onClick={() => setTakingTest(null)} className="text-zinc-500 hover:text-white transition-colors ml-4 shrink-0">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                            {(takingTest.questions || []).map((q: any, i: number) => (
                                <div key={q.id}>
                                    <p className="text-sm font-semibold text-white mb-3">{i + 1}. {q.question}</p>
                                    <div className="space-y-2">
                                        {(q.options || []).map((opt: string, oi: number) => {
                                            const letter = OPTION_LABELS[oi];
                                            const selected = testAnswers[q.id] === letter;
                                            return (
                                                <button
                                                    key={letter}
                                                    onClick={() => setTestAnswers(prev => ({ ...prev, [q.id]: letter }))}
                                                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                                                        selected
                                                            ? 'bg-blue-500/20 border-blue-500 text-white'
                                                            : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-600 hover:text-white'
                                                    }`}
                                                >
                                                    <span className={`font-bold mr-2 ${selected ? 'text-blue-400' : 'text-zinc-600'}`}>
                                                        {letter}.
                                                    </span>
                                                    {opt}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-6 border-t border-zinc-800 shrink-0">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs text-zinc-500">
                                    {Object.keys(testAnswers).length} / {takingTest.questions?.length} answered
                                </p>
                                <p className="text-[10px] text-zinc-600 italic">Results update your THG skill graph</p>
                            </div>
                            <button
                                onClick={handleSubmitTest}
                                disabled={testSubmitting || Object.keys(testAnswers).length < (takingTest.questions?.length || 10)}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-xl font-semibold text-sm transition-all"
                            >
                                {testSubmitting ? 'Submitting…' : 'Submit Assessment'}
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}
