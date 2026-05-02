'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Terminal, Shield, Lock, ArrowRight, Command } from 'lucide-react';

export default function TechPortalLogin() {
    const router = useRouter();
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [status, setStatus] = useState<'idle' | 'authenticating' | 'error'>('idle');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('authenticating');

        // Mock Auth for UI Perfection
        setTimeout(() => {
            if (credentials.username === 'admin' && credentials.password === 'admin') {
                router.push('/tech/dashboard');
            } else {
                setStatus('error');
            }
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 selection:bg-cyan-500/30">
            {/* Background Grid Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

            <div className="relative max-w-md w-full animate-fade">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 mb-6 group hover:border-cyan-500/50 transition-all duration-500">
                        <Terminal size={32} className="text-cyan-500 group-hover:scale-110 transition-transform" />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tighter text-white mb-2">TECH <span className="text-cyan-500">OPS</span></h1>
                    <p className="text-gray-500 text-sm font-mono uppercase tracking-[0.2em]">Administrative Handshake Required</p>
                </div>

                {/* Login Card */}
                <div className="glass-card p-8 border-cyan-500/10 hover:border-cyan-500/20 transition-all duration-500 group">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest flex items-center gap-2">
                                <Command size={10} /> Operator ID
                            </label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="SYSTEM ADMIN"
                                    className="w-full bg-black/50 border border-zinc-800 p-3 rounded-lg text-sm text-cyan-50 outline-none focus:border-cyan-500/50 transition-all placeholder:text-zinc-700 font-mono"
                                    value={credentials.username}
                                    onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                                    required
                                />
                                <Shield className="absolute right-3 top-3.5 text-zinc-800" size={16} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest flex items-center gap-2">
                                <Lock size={10} /> Encryption Key
                            </label>
                            <div className="relative">
                                <input 
                                    type="password" 
                                    placeholder="••••••••"
                                    className="w-full bg-black/50 border border-zinc-800 p-3 rounded-lg text-sm text-cyan-50 outline-none focus:border-cyan-500/50 transition-all placeholder:text-zinc-700 font-mono"
                                    value={credentials.password}
                                    onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                                    required
                                />
                            </div>
                        </div>

                        {status === 'error' && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] p-2 rounded text-center animate-shake uppercase font-mono">
                                Access Denied: Invalid Credentials
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={status === 'authenticating'}
                            className="w-full btn-large !bg-cyan-600 hover:!bg-cyan-500 border-none shadow-lg shadow-cyan-500/10 relative overflow-hidden group/btn"
                        >
                            {status === 'authenticating' ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    DECRYPTING...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    ESTABLISH LINK <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                                </span>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-zinc-800/50 text-center">
                        <p className="text-[10px] text-zinc-500 font-mono italic">
                            UNAUTHORIZED ACCESS TO THIS PORTAL IS LOGGED AND TRACED BY FUSION-OS
                        </p>
                    </div>
                </div>

                {/* Footer Meta */}
                <div className="mt-6 flex justify-between items-center px-2">
                    <div className="flex gap-4">
                        <span className="text-[9px] text-zinc-700 font-mono">NODE_ID: 0x821F</span>
                        <span className="text-[9px] text-zinc-700 font-mono">STATUS: SECURE</span>
                    </div>
                    <button 
                        onClick={() => router.push('/')}
                        className="text-[9px] text-zinc-500 hover:text-white transition-colors flex items-center gap-1 font-mono"
                    >
                        [ EXIT PORTAL ]
                    </button>
                </div>
            </div>
        </div>
    );
}
