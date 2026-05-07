'use client';

import React, { useEffect, useState } from 'react';
import {
    Terminal as TermIcon, Shield, Users, Command,
    Activity, Search, UserPlus, Database, Server, 
    Globe, Lock, List, XCircle, Edit3, Trash2
} from 'lucide-react';
import axios from 'axios';
import {
    ReactFlow,
    Background,
    Handle,
    Position,
    useNodesState,
    useEdgesState,
    ReactFlowProvider,
    useViewport
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { LiveAuditHUD } from '@/components/tech/LiveAuditHUD';
import { DataExplorer } from '@/components/tech/DataExplorer';

const GATEWAY_URL = "http://127.0.0.1:8000/api/v1";

// --- Custom XYFlow Components ---
const SystemXNode = ({ data }: any) => (
    <div className={`p-8 rounded-[2rem] border border-zinc-800 bg-zinc-900/90 backdrop-blur-xl min-w-[340px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative group hover:border-cyan-500/50 transition-all duration-500`}>
        {data.tier !== '00_Edge' && !data.hideTarget && (
            <Handle type="target" position={Position.Left} className="!bg-zinc-500 !w-4 !h-4 pointer-events-none !-left-2" />
        )}
        <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
                <div className={`w-3.5 h-3.5 rounded-full ${data.status === 'healthy' ? 'bg-green-500 shadow-[0_0_20px_#22c55e]' : 'bg-yellow-500 shadow-[0_0_20px_#f59e0b]'}`} />
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
        {data.tier !== '04_Data' && !data.hideSource && (
            <Handle type="source" position={Position.Right} className="!bg-zinc-500 !w-4 !h-4 pointer-events-none !-right-2" />
        )}
    </div>
);

const nodeTypes = { systemX: SystemXNode };

const initialNodes = [
    { id: 'client-vs', type: 'systemX', position: { x: 100, y: 100 }, data: { label: 'VS Code Ext', id: 'ADT_VSIX', status: 'healthy', tier: '00_Edge', type: 'client' } },
    { id: 'client-web', type: 'systemX', position: { x: 100, y: 850 }, data: { label: 'Web Portal', id: 'ADT_NEXTJS', status: 'healthy', tier: '00_Edge', type: 'client' } },
    { id: 'gateway', type: 'systemX', position: { x: 100, y: 500 }, data: { label: 'Gateway', id: 'GATEWAY_PROXY', status: 'healthy', tier: '01_System', latency: '8ms' } },
    { id: 'auth', type: 'systemX', position: { x: 850, y: 100 }, data: { label: 'Auth', id: 'AUTH_SRV', status: 'healthy', tier: '02_Logic', latency: '24ms' } },
    { id: 'telemetry', type: 'systemX', position: { x: 850, y: 500 }, data: { label: 'Telemetry', id: 'TELEMETRY_SRV', status: 'healthy', tier: '02_Logic', latency: '12ms' } },
    { id: 'monitoring', type: 'systemX', position: { x: 850, y: 850 }, data: { label: 'Monitoring', id: 'MONITOR_SRV', status: 'healthy', tier: '02_Logic', latency: '15ms' } },
    { id: 'fusion', type: 'systemX', position: { x: 1600, y: 50 }, data: { label: 'Fusion', id: 'FUSION_SRV', status: 'warning', tier: '03_Intel', latency: '142ms' } },
    { id: 'allocation', type: 'systemX', position: { x: 1600, y: 350 }, data: { label: 'Allocation', id: 'ALLOC_SRV', status: 'healthy', tier: '03_Intel', latency: '54ms' } },
    { id: 'analytics', type: 'systemX', position: { x: 1600, y: 650 }, data: { label: 'Analytics', id: 'ANAL_SRV', status: 'healthy', tier: '03_Intel', latency: '88ms', hideSource: true } },
    { id: 'task', type: 'systemX', position: { x: 1600, y: 950 }, data: { label: 'Task', id: 'TASK_SRV', status: 'healthy', tier: '03_Intel', latency: '32ms' } },
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
    { id: 'e-tel-fusion', source: 'telemetry', target: 'fusion', animated: true, style: { stroke: '#06b6d4', strokeWidth: 2 } },
    { id: 'e-fusion-thg', source: 'fusion', target: 'thg', animated: true, style: { stroke: '#06b6d4', strokeWidth: 2 } },
    { id: 'e-auth-mongo', source: 'auth', target: 'db-mongo', animated: true, style: { stroke: '#06b6d4', strokeWidth: 2 } },
    { id: 'e-mon-mongo', source: 'monitoring', target: 'db-mongo', animated: true, style: { stroke: '#06b6d4', strokeWidth: 2 } },
    { id: 'e-mon-redis', source: 'monitoring', target: 'db-redis', animated: true, style: { stroke: '#a855f7', strokeWidth: 2 } },
    { id: 'e-tel-mon', source: 'telemetry', target: 'monitoring', animated: true, style: { stroke: '#06b6d4', strokeWidth: 1, strokeDasharray: '5,5' } },
    { id: 'e-bridge-thg', source: 'bridge', target: 'thg', animated: true, style: { stroke: '#ec4899', strokeWidth: 2 } },
];

export default function TechSupportDashboard() {
    const [activeTab, setActiveTab] = useState<'infra' | 'logs' | 'data'>('infra');
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        setTimeout(() => setLoading(false), 800);
    }, []);

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center font-mono text-cyan-500 animate-pulse uppercase tracking-[0.5em]">System_Initializing...</div>;

    return (
        <div className="min-h-screen bg-black text-white p-8 font-sans">
            <header className="flex justify-between items-center mb-12">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-1.5 h-8 bg-cyan-600 rounded-full" />
                        <h1 className="text-2xl font-black tracking-[0.3em] uppercase italic text-white">System-X</h1>
                    </div>
                </div>

                <nav className="flex gap-1 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800">
                    {[
                        { id: 'infra', label: 'Infrastructure', icon: <Server size={14} /> },
                        { id: 'logs', label: 'Live Audit Logs', icon: <Activity size={14} /> },
                        { id: 'data', label: 'Data Vault (Explorer)', icon: <Database size={14} /> }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-6 py-2 rounded-md text-[10px] font-bold transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20' : 'text-zinc-500 hover:text-white'}`}
                        >
                            {tab.icon} {tab.label.toUpperCase()}
                        </button>
                    ))}
                </nav>
                <div className="w-24" />
            </header>

            <main className="h-[calc(100vh-200px)] animate-fade">
                {activeTab === 'infra' && (
                    <ReactFlowProvider>
                        <InfrastructureView />
                    </ReactFlowProvider>
                )}
                {activeTab === 'logs' && <LiveAuditHUD />}
                {activeTab === 'data' && <DataExplorer />}
            </main>
        </div>
    );
}

function InfrastructureView() {
    const getInitialLayout = () => {
        if (typeof window === 'undefined') return initialNodes;
        const saved = localStorage.getItem('ADT_NEXUS_LAYOUT');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return initialNodes.map(n => ({ ...n, position: parsed[n.id] || n.position }));
            } catch (e) { return initialNodes; }
        }
        return initialNodes;
    };

    const [nodes, setNodes, onNodesChange] = useNodesState(getInitialLayout());
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [selectedNode, setSelectedNode] = useState<any>(null);
    const [isDraggable, setIsDraggable] = useState(false);

    useEffect(() => {
        const layout: Record<string, { x: number, y: number }> = {};
        nodes.forEach(n => { layout[n.id] = n.position; });
        localStorage.setItem('ADT_NEXUS_LAYOUT', JSON.stringify(layout));
    }, [nodes]);

    const { x: panX, y: panY, zoom } = useViewport();
    const activeNode = nodes.find(n => n.id === selectedNode?.id);

    return (
        <div className="h-full relative overflow-hidden glass-card border-zinc-800">
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1 bg-black/50 backdrop-blur-md border border-zinc-800 rounded-lg">
                <Activity size={12} className="text-cyan-500" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Live Topology Graph</span>
            </div>

            <div className="absolute top-4 right-4 z-20 flex gap-2">
                <button
                    onClick={() => setIsDraggable(!isDraggable)}
                    className={`px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${isDraggable ? 'bg-cyan-600 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'bg-zinc-900/80 border-zinc-700 text-zinc-500 hover:text-white'}`}
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
                onNodeClick={(_, node) => setSelectedNode(node)}
                onPaneClick={() => setSelectedNode(null)}
                nodeTypes={nodeTypes}
                fitView
                className="bg-black"
                nodesDraggable={isDraggable}
                nodesConnectable={false}
                elementsSelectable={true}
                zoomOnScroll={false}
                panOnDrag={isDraggable}
            >
                <Background color="#18181b" gap={20} />

                {activeNode && (
                    <div
                        className="absolute z-50 pointer-events-none transition-all duration-75"
                        style={{
                            left: activeNode.position.x > 1500
                                ? `${(activeNode.position.x * zoom) + panX - (420 * zoom)}px`
                                : `${(activeNode.position.x * zoom) + panX + (360 * zoom)}px`,
                            top: activeNode.position.y > 700
                                ? `${(activeNode.position.y * zoom) + panY - (450 * zoom)}px`
                                : `${(activeNode.position.y * zoom) + panY}px`
                        }}
                    >
                        <div className="pointer-events-auto w-[400px] glass-card border-cyan-500/50 bg-black/95 p-10 shadow-[0_0_100px_rgba(0,0,0,0.9)]" style={{ transform: `scale(${Math.max(0.7, zoom)})`, transformOrigin: 'top left' }}>
                            <div className="mb-10 flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className={`w-3 h-3 rounded-full ${activeNode.data.status === 'healthy' ? 'bg-green-500 shadow-[0_0_12px_#22c55e]' : 'bg-yellow-500 shadow-[0_0_12px_#f59e0b]'}`} />
                                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{activeNode.data.tier}</span>
                                    </div>
                                    <h3 className="text-2xl font-black uppercase tracking-[0.2em]">{activeNode.data.label}</h3>
                                    <p className="text-xs font-mono text-cyan-500 mt-2">{activeNode.data.id}</p>
                                </div>
                                <button onClick={() => setSelectedNode(null)} className="text-zinc-500 hover:text-white"><XCircle size={20} /></button>
                            </div>

                            <div className="space-y-8">
                                {selectedNode.id === 'client-vs' && (
                                    <div className="space-y-6">
                                        <div className="p-5 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                                            <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />
                                                Continuous Monitoring Active
                                            </p>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center text-[10px]">
                                                    <span className="text-zinc-500 uppercase font-bold">Sync_Protocol</span>
                                                    <span className="text-white font-mono">SHEC_v2 (Eventual Consistency)</span>
                                                </div>
                                                <div className="flex justify-between items-center text-[10px]">
                                                    <span className="text-zinc-500 uppercase font-bold">Perimeter_Mode</span>
                                                    <span className="text-white font-mono">Company_Property_Override</span>
                                                </div>
                                                <div className="flex justify-between items-center text-[10px]">
                                                    <span className="text-zinc-500 uppercase font-bold">Audit_State</span>
                                                    <span className="text-green-500 font-mono font-bold">PERMANENT_RECORD</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-5 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] mb-4">Infrastructure Status</p>
                                            <div className="space-y-2">
                                                <p className="text-[10px] text-zinc-400 italic">"Monitoring is active globally for all office-issued hardware. Manual overrides are disabled."</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-4">
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] mb-2">Service Lifecycle</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button className="p-4 bg-green-500/10 border border-green-500/20 text-green-500 rounded-xl text-[10px] font-bold uppercase hover:bg-green-500/20 tracking-widest transition-all">Restart_Node</button>
                                        <button className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-[10px] font-bold uppercase hover:bg-red-500/20 tracking-widest transition-all">Shut_Down</button>
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
    );
}
