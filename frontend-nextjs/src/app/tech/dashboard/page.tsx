'use client';

import React, { useEffect, useState } from 'react';
import {
    Terminal as TermIcon, Shield, Users, Command,
    ArrowRight, Activity, Search, UserPlus,
    Database, Server, Calendar, Globe,
    Lock, List, Key, Trash2, CheckCircle2, XCircle,
    GitMerge, LayoutGrid, Grid, Maximize, Edit3
} from 'lucide-react';
import axios from 'axios';
import {
    ReactFlow,
    Background,
    Controls,
    Handle,
    Position,
    useNodesState,
    useEdgesState,
    addEdge,
    MarkerType,
    ReactFlowProvider,
    useViewport
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const GATEWAY_URL = "http://localhost:8000/api/v1";

// --- Custom XYFlow Components ---

const SystemXNode = ({ data }: any) => (
    <div className={`p-8 rounded-[2rem] border border-zinc-800 bg-zinc-900/90 backdrop-blur-xl min-w-[340px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative group hover:border-cyan-500/50 transition-all duration-500`}>
        {/* Only show target handle if not an entry node or explicitly hidden */}
        {data.tier !== '00_Edge' && !data.hideTarget && (
            <Handle type="target" position={Position.Left} className="!bg-zinc-500 !w-4 !h-4 pointer-events-none !-left-2" />
        )}

        <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
                <div className={`w-3.5 h-3.5 rounded-full ${data.status === 'healthy' ? 'bg-green-500 shadow-[0_0_20px_#22c55e]' : 'bg-yellow-500 shadow-[0_0_20px_#f59e0b]'}`} />
                {/* Hide tier label for first and last nodes */}
                {data.tier !== '00_Edge' && data.tier !== '04_Data' && (
                    <span className="text-xs font-mono text-zinc-500 uppercase tracking-[0.3em]">{data.tier}</span>
                )}
            </div>
            {data.type === 'client' ? <Globe size={18} className="text-zinc-600" /> : <Server size={18} className="text-zinc-600" />}
        </div>

        <p className="text-lg font-black text-white uppercase tracking-[0.2em] mb-2 leading-none">{data.label}</p>
        <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest leading-relaxed">{data.id}</p>

        {data.latency && (
            <div className="mt-6 pt-6 border-t border-zinc-800/50 flex justify-between items-center">
                <span className="text-xs text-zinc-600 uppercase font-bold tracking-[0.2em]">Signal_Latency</span>
                <span className="text-sm font-mono text-cyan-500 font-bold bg-cyan-500/5 px-3 py-1 rounded-lg border border-cyan-500/10">{data.latency}</span>
            </div>
        )}

        {/* Only show source handle if not a termination node or explicitly hidden */}
        {data.tier !== '04_Data' && !data.hideSource && (
            <Handle type="source" position={Position.Right} className="!bg-zinc-500 !w-4 !h-4 pointer-events-none !-right-2" />
        )}
    </div>
);

const nodeTypes = { systemX: SystemXNode };

export default function TechSupportDashboard() {
    const [activeTab, setActiveTab] = useState<'infra' | 'logs'>('infra');
    const [loading, setLoading] = useState(true);

    // Global Policy States (Shared with Infra View)
    const [isHoliday, setIsHoliday] = useState(false);
    const [allowRemote, setAllowRemote] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 800); // System self-check simulation
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center font-mono text-cyan-500 animate-pulse uppercase tracking-[0.5em]">System_Initializing...</div>;

    return (
        <div className="min-h-screen bg-[#000000] text-white p-8 font-sans selection:bg-cyan-500/30">
            {/* Unified Header */}
            <header className="flex justify-between items-center mb-12 animate-slide-down">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-1.5 h-8 bg-cyan-600 rounded-full shadow-[0_0_15px_#06b6d4]" />
                        <h1 className="text-2xl font-black tracking-[0.3em] uppercase italic">System-X</h1>
                    </div>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.4em] ml-5">Administrative Command & Data Nexus</p>
                </div>

                <nav className="flex gap-1 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800">
                    {[
                        { id: 'infra', label: 'Infrastructure & Data', icon: <Server size={14} /> },
                        { id: 'logs', label: 'Live Service Monitoring', icon: <Activity size={14} /> }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-6 py-2 rounded-md text-[10px] font-bold transition-all flex items-center gap-2 ${activeTab === tab.id
                                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                                    : 'text-zinc-500 hover:text-white'
                                }`}
                        >
                            {tab.icon} {tab.label.toUpperCase()}
                        </button>
                    ))}
                </nav>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-[9px] font-bold text-green-500 uppercase tracking-widest">Nexus Active</span>
                    </div>
                </div>
            </header>

            <main className="animate-fade">
                {activeTab === 'infra' && (
                    <ReactFlowProvider>
                        <InfrastructureView
                            isHoliday={isHoliday}
                            setIsHoliday={setIsHoliday}
                            allowRemote={allowRemote}
                            setAllowRemote={setAllowRemote}
                        />
                    </ReactFlowProvider>
                )}
                {activeTab === 'logs' && <ServiceLogsView />}
            </main>
        </div>
    );
}

// --- Sub-Views ---

// --- Sub-Views ---

function OrchestrationView({ pms, devs, selectedPM, setSelectedPM, onRefresh }: any) {
    return (
        <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 lg:col-span-4 space-y-4">
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">Select Manager</h3>
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {pms.map((pm: any) => (
                        <div
                            key={pm.user_id}
                            onClick={() => setSelectedPM(pm)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedPM?.user_id === pm.user_id
                                ? 'bg-cyan-600/10 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.1)]'
                                : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                                }`}
                        >
                            <p className="font-bold text-sm">{pm.name}</p>
                            <p className="text-[10px] text-zinc-500 font-mono mt-1">UUID: {pm.user_id.slice(0, 12)}</p>
                        </div>
                    ))}
                </div>
            </div>
            <div className="col-span-12 lg:col-span-8">
                <div className="glass-card p-6 border-zinc-800">
                    <h3 className="text-sm font-bold mb-6 flex items-center gap-2">
                        <Users size={16} className="text-cyan-500" />
                        Team Allocation Matrix
                    </h3>
                    <table className="w-full">
                        <thead>
                            <tr className="text-[9px] text-zinc-600 uppercase tracking-[0.3em] border-b border-zinc-800">
                                <th className="pb-4 text-left">Developer Twin</th>
                                <th className="pb-4 text-left">Sync Status</th>
                                <th className="pb-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {devs.map((dev: any) => (
                                <tr key={dev.user_id} className="border-b border-zinc-900 group">
                                    <td className="py-4 font-mono text-xs">{dev.name}</td>
                                    <td className="py-4">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${dev.manager_id ? 'bg-cyan-500/10 text-cyan-500' : 'bg-red-500/10 text-red-500'}`}>
                                            {dev.manager_id ? 'MANAGED' : 'STANDALONE'}
                                        </span>
                                    </td>
                                    <td className="py-4 text-right">
                                        <button className="text-zinc-500 hover:text-cyan-500 transition-colors">
                                            <UserPlus size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

const initialNodes = [
    // Column 1: Edge & Gateway
    { id: 'client-vs', type: 'systemX', position: { x: 100, y: 100 }, data: { label: 'VS Code Ext', id: 'ADT_VSIX', status: 'healthy', tier: '00_Edge', type: 'client' } },
    { id: 'client-web', type: 'systemX', position: { x: 100, y: 850 }, data: { label: 'Web Portal', id: 'ADT_NEXTJS', status: 'healthy', tier: '00_Edge', type: 'client' } },
    { id: 'gateway', type: 'systemX', position: { x: 100, y: 500 }, data: { label: 'Gateway', id: 'GATEWAY_PROXY', status: 'healthy', tier: '01_System', latency: '8ms' } },

    // Column 2: Logic & Telemetry
    { id: 'auth', type: 'systemX', position: { x: 850, y: 100 }, data: { label: 'Auth', id: 'AUTH_SRV', status: 'healthy', tier: '02_Logic', latency: '24ms' } },
    { id: 'telemetry', type: 'systemX', position: { x: 850, y: 500 }, data: { label: 'Telemetry', id: 'TELEMETRY_SRV', status: 'healthy', tier: '02_Logic', latency: '12ms' } },
    { id: 'monitoring', type: 'systemX', position: { x: 850, y: 850 }, data: { label: 'Monitoring', id: 'MONITOR_SRV', status: 'healthy', tier: '02_Logic', latency: '15ms' } },

    // Column 3: Intelligence Cluster
    { id: 'fusion', type: 'systemX', position: { x: 1600, y: 50 }, data: { label: 'Fusion', id: 'FUSION_SRV', status: 'warning', tier: '03_Intel', latency: '142ms' } },
    { id: 'allocation', type: 'systemX', position: { x: 1600, y: 350 }, data: { label: 'Allocation', id: 'ALLOC_SRV', status: 'healthy', tier: '03_Intel', latency: '54ms' } },
    { id: 'analytics', type: 'systemX', position: { x: 1600, y: 650 }, data: { label: 'Analytics', id: 'ANAL_SRV', status: 'healthy', tier: '03_Intel', latency: '88ms', hideSource: true } },
    { id: 'task', type: 'systemX', position: { x: 1600, y: 950 }, data: { label: 'Task', id: 'TASK_SRV', status: 'healthy', tier: '03_Intel', latency: '32ms' } },

    // Column 4: Data & Neural
    { id: 'db-mongo', type: 'systemX', position: { x: 2350, y: 100 }, data: { label: 'MongoDB', id: 'DB_MONGO', status: 'healthy', tier: '04_Data', latency: '4ms' } },
    { id: 'db-redis', type: 'systemX', position: { x: 2350, y: 400 }, data: { label: 'Redis', id: 'DB_REDIS', status: 'healthy', tier: '04_Data', latency: '1ms' } },
    { id: 'thg', type: 'systemX', position: { x: 2350, y: 700 }, data: { label: 'THG Graph', id: 'DB_THG', status: 'healthy', tier: '04_Data', latency: '45ms' } },
    { id: 'bridge', type: 'systemX', position: { x: 2350, y: 1000 }, data: { label: 'Neural Bridge', id: 'AI_BRIDGE', status: 'healthy', tier: '05_Neural', latency: '210ms', hideSource: true } },
];

const initialEdges = [
    { id: 'e1-2', source: 'client-vs', target: 'gateway', animated: true, style: { stroke: '#06b6d4', strokeWidth: 2 } },
    { id: 'e1-3', source: 'client-web', target: 'gateway', animated: true, style: { stroke: '#06b6d4', strokeWidth: 2 } },

    { id: 'e2-auth', source: 'gateway', target: 'auth', animated: true, style: { stroke: '#06b6d4', strokeWidth: 2 } },
    { id: 'e2-tel', source: 'gateway', target: 'telemetry', animated: true, style: { stroke: '#06b6d4', strokeWidth: 2 } },
    { id: 'e2-mon', source: 'gateway', target: 'monitoring', animated: true, style: { stroke: '#06b6d4', strokeWidth: 2 } },
    { id: 'e2-task', source: 'gateway', target: 'task', animated: true, style: { stroke: '#06b6d4', strokeWidth: 2 } },
    { id: 'e2-alloc', source: 'gateway', target: 'allocation', animated: true, style: { stroke: '#06b6d4', strokeWidth: 2 } },

    { id: 'e-tel-fusion', source: 'telemetry', target: 'fusion', animated: true, style: { stroke: '#06b6d4', strokeWidth: 2 } },
    { id: 'e-tel-anal', source: 'telemetry', target: 'analytics', animated: true, style: { stroke: '#06b6d4', strokeWidth: 2 } },
    { id: 'e-task-mon', source: 'task', target: 'monitoring', animated: true, style: { stroke: '#06b6d4', strokeWidth: 2 } },
    { id: 'e-alloc-mon', source: 'allocation', target: 'monitoring', animated: true, style: { stroke: '#06b6d4', strokeWidth: 2 } },

    { id: 'e-fusion-thg', source: 'fusion', target: 'thg', animated: true, style: { stroke: '#06b6d4', strokeWidth: 2 } },
    { id: 'e-fusion-bridge', source: 'fusion', target: 'bridge', animated: true, style: { stroke: '#06b6d4', strokeWidth: 2 } },
    { id: 'e-auth-mongo', source: 'auth', target: 'db-mongo', animated: true, style: { stroke: '#06b6d4', strokeWidth: 2 } },
    { id: 'e-auth-redis', source: 'auth', target: 'db-redis', animated: true, style: { stroke: '#06b6d4', strokeWidth: 2 } },
];

function InfrastructureView({ isHoliday, setIsHoliday, allowRemote, setAllowRemote }: any) {
    // Pre-calculate initial nodes for TypeScript compatibility (useNodesState doesn't support lazy init functions)
    const getInitialLayout = () => {
        if (typeof window === 'undefined') return initialNodes;
        const saved = localStorage.getItem('ADT_NEXUS_LAYOUT');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return initialNodes.map(n => ({
                    ...n,
                    position: parsed[n.id] || n.position
                }));
            } catch (e) {
                return initialNodes;
            }
        }
        return initialNodes;
    };

    const [nodes, setNodes, onNodesChange] = useNodesState(getInitialLayout());

    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [selectedNode, setSelectedNode] = useState<any>(null);
    const [isDraggable, setIsDraggable] = useState(false);
    const [explorerModel, setExplorerModel] = useState<string | null>(null);
    const [dbData, setDbData] = useState<any[]>([]);
    const [editingUser, setEditingUser] = useState<any>(null);

    // Persistence Engine: Save layout whenever nodes move
    useEffect(() => {
        const layout: Record<string, { x: number, y: number }> = {};
        nodes.forEach(n => {
            layout[n.id] = n.position;
        });
        localStorage.setItem('ADT_NEXUS_LAYOUT', JSON.stringify(layout));
    }, [nodes]);

    // Coordinate Projection Engine
    const { x: panX, y: panY, zoom } = useViewport();

    // Find the live position of the selected node for the HUD
    const activeNode = nodes.find(n => n.id === selectedNode?.id);

    const onNodeClick = (_: any, node: any) => {
        setSelectedNode(node);
    };

    const fetchDbData = async (model: string) => {
        setExplorerModel(model);
        
        // Simulated Network Latency
        setTimeout(async () => {
            try {
                const endpoint = model === 'Users' ? 'devs' : model === 'PMs' ? 'pms' : 'whitelist';
                const res = await axios.get(`${GATEWAY_URL}/${endpoint}`);
                setDbData(res.data);
            } catch (error) {
                console.warn(`Nexus Gateway Offline. Injecting simulated ${model} cluster data.`);
                
                // High-Fidelity Mock Data Pools
                const mocks: Record<string, any[]> = {
                    'Users': [
                        { name: 'Arjun Mehta', user_id: 'DEV_001_ALPHA', pm_id: 'PM_HAYDEN_09' },
                        { name: 'Sarah Chen', user_id: 'DEV_042_BETA', pm_id: 'PM_REED_21' },
                        { name: 'Liam Wilson', user_id: 'DEV_019_GAMMA', pm_id: 'PM_HAYDEN_09' },
                        { name: 'Elena Rodriguez', user_id: 'DEV_105_DELTA', pm_id: 'PM_REED_21' }
                    ],
                    'PMs': [
                        { name: 'Hayden Pierce', user_id: 'PM_HAYDEN_09', pm_id: 'SUPER_ADMIN' },
                        { name: 'Reed Harrison', user_id: 'PM_REED_21', pm_id: 'SUPER_ADMIN' }
                    ],
                    'Whitelist': [
                        { name: 'Internal_Nexus_Proxy', user_id: 'NODE_127_0_0_1', pm_id: 'SYSTEM_LEVEL' },
                        { name: 'VS_Ext_Mainframe', user_id: 'OAUTH_ADT_VSIX', pm_id: 'APP_LEVEL' },
                        { name: 'Neural_Bridge_Auth', user_id: 'AI_AGENT_CORE', pm_id: 'BRIDGE_LEVEL' }
                    ]
                };
                
                setDbData(mocks[model] || []);
            }
        }, 400);
    };

    return (
        <div className="space-y-12">
            <div className="h-[800px] w-full glass-card border-zinc-800 overflow-hidden relative group">
                <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1 bg-black/50 backdrop-blur-md border border-zinc-800 rounded-lg">
                    <Activity size={12} className="text-cyan-500" />
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Live Topology Graph</span>
                </div>

                <div className="absolute top-4 right-4 z-20 flex gap-2">
                    <button
                        onClick={() => setIsDraggable(!isDraggable)}
                        className={`px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${isDraggable
                                ? 'bg-cyan-600 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                                : 'bg-zinc-900/80 border-zinc-700 text-zinc-500 hover:text-white'
                            }`}
                    >
                        {isDraggable ? <Command size={10} /> : <Lock size={10} />}
                        {isDraggable ? 'Blueprint_Mode: Drag_Active' : 'Nexus_Lock: Fixed_View'}
                    </button>
                </div>

                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeClick={onNodeClick}
                    onPaneClick={() => setSelectedNode(null)}
                    nodeTypes={nodeTypes}
                    fitView
                    className="bg-black"
                    nodesDraggable={isDraggable}
                    nodesConnectable={false}
                    elementsSelectable={true}
                    zoomOnScroll={false}
                    zoomOnPinch={false}
                    panOnDrag={false}
                    panOnScroll={false}
                    preventScrolling={false}
                >
                    <Background color="#18181b" gap={20} />

                    {/* Projected Floating Command HUD */}
                    {activeNode && (
                        <div
                            className="absolute z-50 pointer-events-none transition-all duration-75"
                            style={{
                                // Project graph coordinate -> viewport pixel space using LIVE position
                                left: activeNode.position.x > 1500
                                    ? `${(activeNode.position.x * zoom) + panX - (420 * zoom)}px`
                                    : `${(activeNode.position.x * zoom) + panX + (360 * zoom)}px`,
                                top: activeNode.position.y > 700
                                    ? `${(activeNode.position.y * zoom) + panY - (450 * zoom)}px`
                                    : `${(activeNode.position.y * zoom) + panY}px`
                            }}
                        >
                            <div
                                className="pointer-events-auto w-[400px] glass-card border-cyan-500/50 bg-black/95 p-10 shadow-[0_0_100px_rgba(0,0,0,0.9)] animate-scale"
                                style={{ transform: `scale(${Math.max(0.7, zoom)})`, transformOrigin: 'top left' }}
                            >
                                <div className="mb-10 flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-4 mb-2">
                                            <div className={`w-3 h-3 rounded-full ${activeNode.data.status === 'healthy' ? 'bg-green-500 shadow-[0_0_12px_#22c55e]' : 'bg-yellow-500 shadow-[0_0_12px_#f59e0b]'}`} />
                                            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{activeNode.data.tier}</span>
                                        </div>
                                        <h3 className="text-2xl font-black uppercase tracking-[0.2em]">{activeNode.data.label}</h3>
                                        <p className="text-xs font-mono text-cyan-500 mt-2">{activeNode.data.id}</p>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); setSelectedNode(null); }} className="text-zinc-500 hover:text-white transition-colors">
                                        <XCircle size={20} />
                                    </button>
                                </div>

                                <div className="space-y-8">
                                    {/* Special: VS Code Extension Policies */}
                                    {selectedNode.id === 'client-vs' && (
                                        <div className="space-y-4 p-5 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] mb-2">System Protocols</p>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-zinc-300">Holiday Protocol</span>
                                                <button onClick={() => setIsHoliday(!isHoliday)} className={`w-10 h-5 rounded-full p-1 transition-all ${isHoliday ? 'bg-cyan-600' : 'bg-zinc-800'}`}>
                                                    <div className={`w-3 h-3 bg-white rounded-full transition-all ${isHoliday ? 'translate-x-5' : 'translate-x-0'}`} />
                                                </button>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-zinc-300">Remote Access Override</span>
                                                <button onClick={() => setAllowRemote(!allowRemote)} className={`w-10 h-5 rounded-full p-1 transition-all ${allowRemote ? 'bg-purple-600' : 'bg-zinc-800'}`}>
                                                    <div className={`w-3 h-3 bg-white rounded-full transition-all ${allowRemote ? 'translate-x-5' : 'translate-x-0'}`} />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Special: MongoDB Collection Explorer */}
                                    {selectedNode.id === 'db-mongo' && (
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] mb-2">Cluster Collections</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                {['Users', 'Twins', 'Whitelist'].map(model => (
                                                    <button
                                                        key={model}
                                                        onClick={() => fetchDbData(model)}
                                                        className={`p-3 rounded-lg border text-xs font-bold transition-all ${explorerModel === model ? 'bg-cyan-600/10 border-cyan-500 text-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}
                                                    >
                                                        {model.toUpperCase()}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Lifecycle & Scaling */}
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] mb-2">Service Lifecycle</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button className="p-4 bg-green-500/10 border border-green-500/20 text-green-500 rounded-xl text-[10px] font-bold uppercase hover:bg-green-500/20 tracking-widest transition-all">Restart_Node</button>
                                            <button className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-[10px] font-bold uppercase hover:bg-red-500/20 tracking-widest transition-all">Shut_Down</button>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                                            <span className="text-xs text-zinc-400 uppercase font-bold tracking-widest">Scaling_Replicas</span>
                                            <div className="flex gap-6 font-mono text-xs">
                                                <button className="text-zinc-500 hover:text-white transition-colors">-</button>
                                                <span className="text-cyan-500 font-bold bg-black px-3 py-1 rounded">03</span>
                                                <button className="text-zinc-500 hover:text-white transition-colors">+</button>
                                            </div>
                                        </div>
                                    </div>

                                    <button className="w-full p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-[10px] font-bold uppercase text-zinc-400 hover:text-white hover:border-zinc-700 flex items-center justify-center gap-3 tracking-[0.2em] transition-all">
                                        <List size={16} /> View_Telemetry_Logs
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </ReactFlow>
            </div>

            {/* Omni-CRUD Data Explorer */}
            {explorerModel && (
                <div className="glass-card p-0 border-zinc-800 overflow-hidden animate-slide-up shadow-[0_30px_100px_rgba(0,0,0,0.5)]">
                    <div className="bg-zinc-900/80 p-6 flex items-center justify-between border-b border-zinc-800 backdrop-blur-xl">
                        <div className="flex items-center gap-6">
                            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 border border-cyan-500/20">
                                <Database size={20} />
                            </div>
                            <div>
                                <h3 className="text-base font-black uppercase tracking-[0.2em] leading-none">Nexus Cluster: {explorerModel}</h3>
                                <p className="text-[10px] text-zinc-500 font-mono mt-2 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                    Read_Write_Active: MongoDB_Shard_01
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setEditingUser({ name: '', user_id: 'NEW_' + Math.random().toString(36).slice(2, 9), pm_id: '' })}
                                className="text-[10px] font-bold bg-cyan-600 text-white px-6 py-2.5 rounded-lg hover:bg-cyan-500 transition-all uppercase tracking-widest shadow-lg shadow-cyan-500/20"
                            >
                                Add_New_Identity
                            </button>
                            <button onClick={() => setExplorerModel(null)} className="text-zinc-500 hover:text-white transition-colors">
                                <XCircle size={24} />
                            </button>
                        </div>
                    </div>

                    <div className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-zinc-900/30 text-[10px] text-zinc-500 uppercase tracking-[0.3em] border-b border-zinc-800">
                                    <tr>
                                        <th className="p-6 font-bold">Document_ID</th>
                                        <th className="p-6 font-bold">Identity_Label</th>
                                        {explorerModel === 'Users' && <th className="p-6 font-bold">Mapped_PM_ID</th>}
                                        <th className="p-6 font-bold">Status</th>
                                        <th className="p-6 font-bold text-right">Nexus_Override</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs font-mono">
                                    {dbData.map((doc) => (
                                        <tr key={doc.user_id} className="border-b border-zinc-900/50 hover:bg-cyan-500/[0.02] transition-all group">
                                            <td className="p-6 text-zinc-500 font-mono tracking-tighter">{doc.user_id}</td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                                                        {doc.name?.charAt(0) || '?'}
                                                    </div>
                                                    <span className="text-white font-bold tracking-wide">{doc.name}</span>
                                                </div>
                                            </td>
                                            {explorerModel === 'Users' && (
                                                <td className="p-6 text-cyan-500/70">{doc.pm_id || 'STANDALONE'}</td>
                                            )}
                                            <td className="p-6">
                                                <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[9px] font-bold tracking-widest uppercase">Validated</span>
                                            </td>
                                            <td className="p-6 text-right">
                                                <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => setEditingUser(doc)} className="p-2 bg-zinc-800 text-cyan-500 rounded-lg hover:bg-cyan-600 hover:text-white transition-all"><Edit3 size={14} /></button>
                                                    <button onClick={() => setDbData(dbData.filter(d => d.user_id !== doc.user_id))} className="p-2 bg-zinc-800 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-all"><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Omni-Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6">
                    <div className="glass-card max-w-xl w-full p-10 border-cyan-500/30 animate-scale shadow-[0_0_150px_rgba(6,182,212,0.1)]">
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-[0.2em]">Identity_Forge</h3>
                                <p className="text-xs text-zinc-500 font-mono mt-2 uppercase tracking-widest">Shard_Modification: {explorerModel}</p>
                            </div>
                            <Activity size={24} className="text-cyan-500" />
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em]">Identity Name</label>
                                <input
                                    value={editingUser.name}
                                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                                    className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-sm focus:border-cyan-500 outline-none transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em]">Document UUID</label>
                                    <input
                                        disabled
                                        value={editingUser.user_id}
                                        className="w-full bg-black/50 border border-zinc-800 p-4 rounded-xl text-[10px] font-mono text-zinc-600"
                                    />
                                </div>
                                {explorerModel === 'Users' && (
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em]">Assigned PM_ID</label>
                                        <input
                                            value={editingUser.pm_id}
                                            onChange={(e) => setEditingUser({ ...editingUser, pm_id: e.target.value })}
                                            placeholder="PM_UUID_OR_NONE"
                                            className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-xs font-mono text-cyan-500 focus:border-cyan-500 outline-none"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-4 mt-12">
                            <button
                                onClick={() => setEditingUser(null)}
                                className="flex-1 py-4 bg-zinc-900 border border-zinc-800 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all"
                            >
                                Abort_Changes
                            </button>
                            <button
                                onClick={() => {
                                    const exists = dbData.find(d => d.user_id === editingUser.user_id);
                                    if (exists) {
                                        setDbData(dbData.map(d => d.user_id === editingUser.user_id ? editingUser : d));
                                    } else {
                                        setDbData([...dbData, editingUser]);
                                    }
                                    setEditingUser(null);
                                }}
                                className="flex-1 py-4 bg-cyan-600 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-cyan-500/20 hover:bg-cyan-500 transition-all"
                            >
                                Commit_Identity
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ServiceLogsView() {
    const services = [
        'ADT_VSIX', 'ADT_NEXTJS', 'NGINX_PROXY', 'PY_AUTH', 'PY_TEL', 'PY_LOGGER',
        'PY_FUSION', 'SCALE_CTRL', 'DB_MONGO', 'DB_REDIS', 'DB_NEO4J', 'AI_BRIDGE'
    ];

    const [layout, setLayout] = useState<'grid' | 'solo' | 'compact'>('grid');

    return (
        <div className="space-y-8 animate-fade">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-xl font-black uppercase tracking-[0.3em]">Live_Telemetry_Matrix</h2>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.4em] mt-2 italic">Real-Time Shard Monitoring Active</p>
                </div>
                <div className="flex gap-2 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800">
                    <button onClick={() => setLayout('compact')} className={`p-2 rounded ${layout === 'compact' ? 'bg-cyan-600' : 'text-zinc-600'}`} title="6x6 Grid"><LayoutGrid size={16} /></button>
                    <button onClick={() => setLayout('grid')} className={`p-2 rounded ${layout === 'grid' ? 'bg-cyan-600' : 'text-zinc-600'}`} title="3x3 Grid"><Grid size={16} /></button>
                    <button onClick={() => setLayout('solo')} className={`p-2 rounded ${layout === 'solo' ? 'bg-cyan-600' : 'text-zinc-600'}`} title="Single Focus"><Maximize size={16} /></button>
                </div>
            </div>

            <div className={`grid gap-4 ${layout === 'compact' ? 'grid-cols-4 md:grid-cols-6' :
                    layout === 'grid' ? 'grid-cols-1 md:grid-cols-3' :
                        'grid-cols-1'
                }`}>
                {services.map(svc => (
                    <div key={svc} className="glass-card border-zinc-800/50 flex flex-col h-[280px] group overflow-hidden">
                        <div className="p-4 bg-zinc-900/50 border-b border-zinc-800 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{svc}</span>
                            </div>
                            <span className="text-[8px] font-mono text-zinc-600">8.2ms</span>
                        </div>
                        <div className="flex-1 bg-[#050505] p-4 font-mono text-[9px] overflow-y-auto custom-scrollbar">
                            <div className="space-y-1.5">
                                <p className="text-zinc-700">[SYSTEM] Initialization sequences complete.</p>
                                <p className="text-cyan-500/50">[AUTH] Connection established from Edge_VSIX.</p>
                                <p className="text-zinc-700">[TEL] Data packet 0x921 ingested.</p>
                                <p className="text-green-500/40">[DB] Shard write committed successfully.</p>
                                <p className="text-zinc-800 animate-pulse">_Listening for telemetry...</p>
                            </div>
                        </div>
                        <div className="p-3 bg-zinc-900/20 border-t border-zinc-800/50 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="text-[8px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest">Restart_Shard</button>
                            <button className="text-[8px] font-bold text-cyan-500 hover:underline uppercase tracking-widest">View_Full_Buffer</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
