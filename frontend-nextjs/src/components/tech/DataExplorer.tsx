'use client';

import React, { useState, useEffect } from 'react';
import { Database, Search, Filter, Save, ChevronLeft, ChevronRight, Edit3, Loader2 } from 'lucide-react';
import axios from 'axios';

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:8000';

export const DataExplorer: React.FC = () => {
    const [collections, setCollections] = useState<string[]>([]);
    const [selectedCollection, setSelectedCollection] = useState('users');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState({ key: '', val: '' });
    const [editingCell, setEditingCell] = useState<{ id: string, field: string } | null>(null);
    const [editValue, setEditValue] = useState('');

    useEffect(() => {
        fetchCollections();
    }, []);

    useEffect(() => {
        fetchData();
    }, [selectedCollection]);

    const fetchCollections = async () => {
        try {
            const resp = await axios.get(`${GATEWAY_URL}/api/v1/auth/admin/explorer/collections`);
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
            const resp = await axios.get(`${GATEWAY_URL}/api/v1/auth/admin/explorer/${selectedCollection}`, { params });
            setData(resp.data.data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const handleCellDoubleClick = (doc: any, field: string) => {
        setEditingCell({ id: doc._id || doc.user_id || doc.key, field });
        setEditValue(String(doc[field] || ''));
    };

    const saveEdit = async () => {
        if (!editingCell) return;
        try {
            await axios.patch(`${GATEWAY_URL}/api/v1/auth/admin/explorer/${selectedCollection}/${editingCell.id}`, {
                [editingCell.field]: editValue
            });
            setEditingCell(null);
            fetchData();
        } catch (err) {
            alert('Failed to update field');
        }
    };

    const renderCell = (doc: any, field: string) => {
        const isEditing = editingCell?.id === (doc._id || doc.user_id || doc.key) && editingCell?.field === field;

        if (isEditing) {
            return (
                <input 
                    autoFocus
                    className="bg-blue-900/50 text-white w-full px-1 border-none outline-none"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={saveEdit}
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                />
            );
        }

        const val = doc[field];
        if (typeof val === 'object') return <span className="text-zinc-600 text-[10px]">JSON</span>;
        return <span className="truncate block" onDoubleClick={() => handleCellDoubleClick(doc, field)}>{String(val)}</span>;
    };

    const columns = data.length > 0 ? Object.keys(data[0]) : [];

    return (
        <div className="glass-card flex flex-col border-zinc-800 h-full">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/30">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-zinc-400">
                        <Database size={16} />
                        <select 
                            value={selectedCollection}
                            onChange={(e) => setSelectedCollection(e.target.value)}
                            className="bg-transparent border-none text-white font-bold outline-none cursor-pointer hover:text-blue-400"
                        >
                            {collections.map(c => <option key={c} value={c} className="bg-zinc-900">{c}</option>)}
                        </select>
                    </div>
                    <div className="h-4 w-[1px] bg-zinc-800" />
                    <div className="flex items-center gap-2 bg-zinc-900/50 px-3 py-1.5 rounded-lg border border-zinc-800">
                        <Search size={14} className="text-zinc-500" />
                        <input 
                            placeholder="Filter key..."
                            className="bg-transparent text-xs outline-none w-24"
                            value={filter.key}
                            onChange={(e) => setFilter({...filter, key: e.target.value})}
                        />
                        <input 
                            placeholder="Value..."
                            className="bg-transparent text-xs outline-none w-24 border-l border-zinc-800 pl-2"
                            value={filter.val}
                            onChange={(e) => setFilter({...filter, val: e.target.value})}
                        />
                        <button onClick={fetchData} className="text-blue-500 hover:text-blue-400">
                            <Search size={14} />
                        </button>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 text-zinc-500 text-xs">
                    <span>{data.length} records</span>
                    <button onClick={fetchData} className="p-1 hover:bg-zinc-800 rounded">
                        <Loader2 size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                <table className="w-full text-left text-[11px] border-collapse">
                    <thead className="sticky top-0 bg-zinc-900 border-b border-zinc-800 z-10">
                        <tr>
                            {columns.map(col => (
                                <th key={col} className="p-3 font-semibold text-zinc-500 uppercase tracking-tighter border-r border-zinc-800/50">
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={columns.length} className="p-12 text-center text-zinc-600">Loading vault data...</td></tr>
                        ) : (
                            data.map((doc, idx) => (
                                <tr key={idx} className="border-b border-zinc-800/30 hover:bg-white/5 transition-colors group">
                                    {columns.map(col => (
                                        <td key={col} className="p-2 border-r border-zinc-800/20 max-w-[200px]">
                                            {renderCell(doc, col)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="p-2 border-t border-zinc-800 bg-zinc-900/50 flex justify-end gap-1">
                 <button className="p-1 hover:bg-zinc-800 rounded text-zinc-500"><ChevronLeft size={16} /></button>
                 <button className="p-1 hover:bg-zinc-800 rounded text-zinc-500"><ChevronRight size={16} /></button>
            </div>
        </div>
    );
};
