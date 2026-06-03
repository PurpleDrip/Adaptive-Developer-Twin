'use client';

import React, { useState, useEffect } from 'react';
import { 
    Database, Search, Filter, Save, ChevronLeft, ChevronRight, 
    Edit3, Loader2, Plus, X, Check, RefreshCw, Terminal 
} from 'lucide-react';
import { api } from '@/lib/api';

export const DataExplorer: React.FC = () => {
    const [collections, setCollections] = useState<string[]>([]);
    const [selectedCollection, setSelectedCollection] = useState('users');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState({ key: '', val: '' });
    
    // UI State
    const [editingCell, setEditingCell] = useState<{ id: string, field: string } | null>(null);
    const [editValue, setEditValue] = useState('');
    const [isAddingField, setIsAddingField] = useState<string | null>(null); // doc_id
    const [newField, setNewField] = useState({ name: '', value: '' });

    useEffect(() => {
        fetchCollections();
    }, []);

    useEffect(() => {
        fetchData();
    }, [selectedCollection]);

    const fetchCollections = async () => {
        try {
            const resp = await api.get(`/auth/admin/explorer/collections`);
            setCollections(resp.data.collections);
        } catch (err) { console.error(err); }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (filter.key && filter.val) {
                params.filter_key = filter.key;
                params.filter_val = filter.val;
            }
            const resp = await api.get(`/auth/admin/explorer/${selectedCollection}`, { params });
            setData(resp.data.data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const handleCellDoubleClick = (doc: any, field: string) => {
        setEditingCell({ id: doc.user_id || doc.task_id || doc.key || doc._id, field });
        setEditValue(String(doc[field] || ''));
    };

    const saveEdit = async () => {
        if (!editingCell) return;
        try {
            await api.patch(`/auth/admin/explorer/${selectedCollection}/${editingCell.id}`, {
                [editingCell.field]: editValue
            });
            setEditingCell(null);
            fetchData();
        } catch (err) {
            alert('Mutation Failed: Target Locked');
        }
    };

    const handleAddField = async (docId: string) => {
        if (!newField.name) return;
        try {
            await api.post(`/auth/admin/explorer/${selectedCollection}/${docId}/field`, null, {
                params: { field_name: newField.name, field_value: newField.value }
            });
            setIsAddingField(null);
            setNewField({ name: '', value: '' });
            fetchData();
        } catch (err) {
            alert('Field Injection Failed');
        }
    };

    const renderCell = (doc: any, field: string) => {
        const docId = doc.user_id || doc.task_id || doc.key || doc._id;
        const isEditing = editingCell?.id === docId && editingCell?.field === field;

        if (isEditing) {
            return (
                <div className="flex items-center bg-blue-500/20 border border-blue-500/50 rounded overflow-hidden">
                    <input 
                        autoFocus
                        className="bg-transparent text-white w-full px-2 py-1 border-none outline-none text-[10px] font-mono"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                    />
                    <button className="p-1 text-blue-400 hover:text-white" onClick={saveEdit}><Check size={10} /></button>
                </div>
            );
        }

        const val = doc[field];
        if (typeof val === 'object') return <span className="text-zinc-600 text-[9px] font-mono italic">{"{JSON}"}</span>;
        
        return (
            <span 
                className="truncate block cursor-text hover:text-blue-400 transition-colors py-1" 
                onDoubleClick={() => handleCellDoubleClick(doc, field)}
            >
                {String(val)}
            </span>
        );
    };

    const columns = data.length > 0 ? Object.keys(data[0]) : [];

    return (
        <div className="glass-card flex flex-col border-zinc-800 h-full overflow-hidden bg-black/40">
            {/* Header / Toolbar */}
            <div className="p-4 border-b border-zinc-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-zinc-900/40 backdrop-blur-md">
                <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                    {/* Collection Selector */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                            <Database size={16} />
                        </div>
                        <div className="relative group">
                            <select 
                                value={selectedCollection}
                                onChange={(e) => setSelectedCollection(e.target.value)}
                                className="bg-zinc-900 border border-zinc-800 text-white text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-xl outline-none cursor-pointer hover:border-blue-500/50 appearance-none min-w-[160px] transition-all"
                            >
                                {collections.map(c => <option key={c} value={c} className="bg-zinc-950">{c}</option>)}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 group-hover:text-blue-500 transition-colors">
                                <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
                            </div>
                        </div>
                    </div>

                    <div className="h-8 w-[1px] bg-zinc-800 hidden sm:block" />

                    {/* Filter HUD */}
                    <div className="flex items-center gap-3 bg-black/60 px-4 py-2 rounded-xl border border-zinc-800 group hover:border-zinc-700 transition-all">
                        <Terminal size={14} className="text-zinc-600" />
                        <div className="flex items-center gap-2">
                            <input 
                                placeholder="KEY_MATCH"
                                className="bg-transparent text-[10px] font-mono font-bold text-zinc-400 outline-none w-28 uppercase placeholder:text-zinc-800"
                                value={filter.key}
                                onChange={(e) => setFilter({...filter, key: e.target.value})}
                            />
                            <span className="text-zinc-800 text-xs">::</span>
                            <input 
                                placeholder="VALUE_QUERY"
                                className="bg-transparent text-[10px] font-mono font-bold text-blue-500 outline-none w-32 placeholder:text-zinc-800"
                                value={filter.val}
                                onChange={(e) => setFilter({...filter, val: e.target.value})}
                            />
                        </div>
                        <button onClick={fetchData} className="ml-2 text-zinc-500 hover:text-white transition-colors">
                            <Search size={14} />
                        </button>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 sm:gap-6">
                    <div className="text-[10px] font-mono font-bold text-zinc-600 uppercase tracking-widest">
                        {loading ? 'READING_DATA_STREAM...' : `ENTRIES_INDEXED: ${data.length}`}
                    </div>
                    <button onClick={fetchData} className={`p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white transition-all ${loading ? 'opacity-50' : ''}`}>
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Main Grid */}
            <div className="flex-1 overflow-auto bg-black/20 custom-scrollbar">
                <table className="w-full text-left text-[10px] font-mono border-collapse">
                    <thead className="sticky top-0 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 z-10 shadow-xl">
                        <tr>
                            <th className="p-4 border-r border-zinc-800/50 w-12 text-zinc-700">#</th>
                            {columns.map(col => (
                                <th key={col} className="p-4 font-black text-zinc-500 uppercase tracking-widest border-r border-zinc-800/30 min-w-[150px]">
                                    <div className="flex items-center justify-between">
                                        {col}
                                        <Filter size={10} className="text-zinc-800" />
                                    </div>
                                </th>
                            ))}
                            <th className="p-4 font-black text-blue-500 uppercase tracking-widest w-24">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && data.length === 0 ? (
                            <tr><td colSpan={columns.length + 2} className="p-24 text-center text-zinc-600 animate-pulse uppercase tracking-[0.3em]">Downloading Vault Contents...</td></tr>
                        ) : (
                            data.map((doc, idx) => {
                                const docId = doc.user_id || doc.task_id || doc.key || doc._id;
                                return (
                                    <tr key={docId || idx} className="border-b border-zinc-900/50 hover:bg-blue-500/5 transition-all group">
                                        <td className="p-4 border-r border-zinc-900 text-zinc-700 font-bold">{idx + 1}</td>
                                        {columns.map(col => (
                                            <td key={col} className="p-3 border-r border-zinc-900/50 max-w-[250px] relative">
                                                {renderCell(doc, col)}
                                            </td>
                                        ))}
                                        <td className="p-3 text-center">
                                            {isAddingField === docId ? (
                                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade">
                                                    <div className="glass-card p-8 w-[400px] border-blue-500/30">
                                                        <h3 className="text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                                                            <Plus size={14} className="text-blue-500" /> Inject_New_Field
                                                        </h3>
                                                        <div className="space-y-4">
                                                            <input 
                                                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-[10px] outline-none focus:border-blue-500" 
                                                                placeholder="FIELD_NAME"
                                                                value={newField.name}
                                                                onChange={e => setNewField({...newField, name: e.target.value.toLowerCase().replace(' ', '_')})}
                                                            />
                                                            <input 
                                                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-[10px] outline-none focus:border-blue-500" 
                                                                placeholder="VALUE"
                                                                value={newField.value}
                                                                onChange={e => setNewField({...newField, value: e.target.value})}
                                                            />
                                                            <div className="flex gap-2 pt-4">
                                                                <button 
                                                                    className="flex-1 py-3 bg-blue-600 text-[10px] font-black uppercase tracking-widest rounded-lg"
                                                                    onClick={() => handleAddField(docId)}
                                                                >
                                                                    Commit_Injection
                                                                </button>
                                                                <button 
                                                                    className="px-4 bg-zinc-800 text-white rounded-lg"
                                                                    onClick={() => setIsAddingField(null)}
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => setIsAddingField(docId)}
                                                    className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-600 hover:text-blue-500 hover:border-blue-500/50 transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer / Pagination */}
            <div className="p-3 border-t border-zinc-800 bg-zinc-950/50 flex justify-between items-center">
                <div className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest px-4">
                    Mode: Data_Vault_Edit_Session
                </div>
                <div className="flex items-center gap-1">
                     <button className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 disabled:opacity-30" disabled><ChevronLeft size={16} /></button>
                     <div className="px-4 text-[10px] font-bold text-zinc-400">PAGE_01</div>
                     <button className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500"><ChevronRight size={16} /></button>
                </div>
            </div>
        </div>
    );
};
