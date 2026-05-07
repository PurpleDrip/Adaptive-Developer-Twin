import React, { useEffect, useState } from 'react';
import { Cpu, Loader2, Zap, Clock, FileCode } from 'lucide-react';
import { authApi } from '@/lib/api/auth';

interface AnalysisHUDProps {
    userId: string;
}

export const AnalysisHUD: React.FC<AnalysisHUDProps & { onComplete: () => void }> = ({ userId, onComplete }) => {
    const [progress, setProgress] = useState<any>(null);
    const [status, setStatus] = useState<'analyzing' | 'completed' | 'error'>('analyzing');

    useEffect(() => {
        const poll = async () => {
            try {
                const data = await authApi.getAnalysisProgress(userId);
                setProgress(data);
                if (data.progress === 100 || data.status === 'completed') {
                    setStatus('completed');
                    onComplete();
                }
            } catch (e) {
                console.error("Failed to poll progress", e);
            }
        };

        const interval = setInterval(poll, 2000);
        poll(); 

        return () => clearInterval(interval);
    }, [userId, onComplete]);

    if (!progress && status === 'analyzing') return (
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-6 flex items-center gap-4 animate-pulse">
            <Loader2 className="animate-spin text-blue-500" />
            <p className="text-sm text-blue-400 font-medium tracking-tight">Initializing Semantic Audit...</p>
        </div>
    );

    return (
        <div className={`transition-all duration-700 p-6 rounded-xl border ${
            status === 'completed' 
            ? 'bg-green-500/10 border-green-500/30' 
            : 'bg-zinc-900/80 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]'
        } mb-6 overflow-hidden relative`}>
            
            <div className="relative z-10">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        {status === 'completed' ? (
                            <Zap className="text-green-500 fill-green-500/20" size={18} />
                        ) : (
                            <Cpu className="text-blue-500 animate-pulse" size={18} />
                        )}
                        <h4 className={`text-[10px] font-black uppercase tracking-widest ${status === 'completed' ? 'text-green-500' : 'text-blue-500'}`}>
                            {status === 'completed' ? 'Initial Baseline Established' : 'Dual Baseline Analysis Active'}
                        </h4>
                    </div>
                    <span className={`text-xs font-mono font-bold ${status === 'completed' ? 'text-green-500' : 'text-blue-400'}`}>
                        {progress?.progress || 0}%
                    </span>
                </div>

                <div className="h-1.5 w-full bg-zinc-800 rounded-full mb-6 overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-1000 ease-out rounded-full ${
                            status === 'completed' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-blue-500 shadow-[0_0_10px_#3b82f6]'
                        }`}
                        style={{ width: `${progress?.progress || 0}%` }}
                    />
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div className="bg-black/40 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <FileCode size={16} className="text-blue-500" />
                            </div>
                            <div>
                                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 block mb-1">Audit Status</span>
                                <p className="text-xs text-white font-mono">
                                    {progress?.status || 'Processing Logic...'}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 block mb-1">Confidence</span>
                            <p className="text-xs text-green-400 font-mono">HIGH-FIDELITY</p>
                        </div>
                    </div>
                </div>

                <p className="mt-6 text-[10px] text-zinc-500 font-medium italic text-center">
                    "{progress?.message || 'Extracting architectural signals from provided repositories...'}"
                </p>
            </div>
        </div>
    );
};
