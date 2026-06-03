'use client';

import React, { useState } from 'react';
import { UserPlus, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { authApi } from '@/lib/api';

interface FormState {
    name: string;
    username: string;
    email: string;
    phone_number: string;
    gender: string;
    department: string;
    password: string;
}

const EMPTY: FormState = {
    name: '', username: '', email: '', phone_number: '',
    gender: 'Male', department: '', password: '',
};

export const CreateManager: React.FC = () => {
    const [form, setForm] = useState<FormState>(EMPTY);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const update = (field: keyof FormState, value: string) =>
        setForm(prev => ({ ...prev, [field]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setSuccess(null);
        setError(null);
        try {
            const resp = await authApi.createManager(form);
            setSuccess(`Manager "${form.name}" created (${resp.data.user_id}).`);
            setForm(EMPTY);
        } catch (err: any) {
            const detail = err?.response?.data?.detail;
            if (Array.isArray(detail)) {
                setError(detail.map((d: any) => d.msg).join(', '));
            } else {
                setError(detail || 'Failed to create manager');
            }
        }
        setSubmitting(false);
    };

    const fields: { key: keyof FormState; label: string; type?: string; placeholder?: string }[] = [
        { key: 'name', label: 'Full Name', placeholder: 'Jane Doe' },
        { key: 'username', label: 'Username', placeholder: 'jane.doe' },
        { key: 'email', label: 'Email', type: 'email', placeholder: 'jane@adt.ai' },
        { key: 'phone_number', label: 'Phone Number', placeholder: '9876543210' },
        { key: 'department', label: 'Department', placeholder: 'Backend' },
        { key: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
    ];

    return (
        <div className="h-full overflow-auto glass-card border-zinc-800 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                    <UserPlus size={18} className="text-cyan-400" />
                </div>
                <div className="min-w-0">
                    <h2 className="text-lg font-bold text-white">Create Manager</h2>
                    <p className="text-[11px] text-zinc-500">Provision a new manager account</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="w-full max-w-xl space-y-4">
                {fields.map(f => (
                    <div key={f.key}>
                        <label className="block text-[11px] uppercase tracking-wider text-zinc-500 mb-1">{f.label}</label>
                        <input
                            type={f.type || 'text'}
                            required
                            value={form[f.key]}
                            placeholder={f.placeholder}
                            onChange={(e) => update(f.key, e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                        />
                    </div>
                ))}

                <div>
                    <label className="block text-[11px] uppercase tracking-wider text-zinc-500 mb-1">Gender</label>
                    <select
                        value={form.gender}
                        onChange={(e) => update('gender', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                    >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                {success && (
                    <div className="flex items-start gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-xs">
                        <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                        <span className="min-w-0 wrap-break-word">{success}</span>
                    </div>
                )}
                {error && (
                    <div className="flex items-start gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                        <span className="min-w-0 wrap-break-word">{error}</span>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center justify-center sm:justify-start gap-2 w-full sm:w-auto px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium transition-all disabled:opacity-50"
                >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                    {submitting ? 'Creating…' : 'Create Manager'}
                </button>
            </form>
        </div>
    );
};
