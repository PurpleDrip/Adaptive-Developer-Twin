import React from 'react';
import { CheckCircle, Copy, Download, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AnalysisHUD } from './AnalysisHUD';

interface SuccessStepProps {
    ids: { userId: string; extensionId: string };
}

export const SuccessStep: React.FC<SuccessStepProps> = ({ ids }) => {
    const router = useRouter();
    const [isDone, setIsDone] = React.useState(false);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-black">
            <div className="max-w-lg w-full p-12 glass-card text-center animate-fade">
                <div className={`mb-6 flex justify-center ${!isDone && 'animate-pulse'}`}>
                    {isDone ? (
                        <CheckCircle size={64} className="text-green-500" />
                    ) : (
                        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    )}
                </div>
                
                <h2 className="text-3xl font-bold gradient-text mb-4">
                    {isDone ? 'Twin Initialized!' : 'Twin Initializing...'}
                </h2>
                <p className="text-gray-400 mb-8">
                    {isDone 
                        ? 'Your digital profile is fully calibrated and ready for audit.' 
                        : 'Establishing your professional baseline and repo intelligence.'}
                </p>
                
                <AnalysisHUD userId={ids.userId} onComplete={() => setIsDone(true)} />
                
                {isDone && (
                    <div className="animate-fade">
                        <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 mb-8 text-left">
                            <p className="text-[10px] font-bold text-blue-500 mb-4 uppercase tracking-[0.3em]">Connection Credentials</p>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] text-gray-500 block mb-1 uppercase font-bold">Extension ID (Required)</label>
                                    <div className="flex justify-between items-center bg-black p-3 rounded border border-zinc-800 group hover:border-purple-500/50 transition-all">
                                        <code className="text-purple-400 font-mono text-sm">{ids.extensionId}</code>
                                        <Copy size={16} className="text-gray-500 cursor-pointer hover:text-white" onClick={() => copyToClipboard(ids.extensionId)} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6 mb-10 text-left">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] mb-4">Tactical Setup Steps</p>
                            <div className="space-y-4">
                                {[
                                    { step: 1, text: "Copy your Extension ID above" },
                                    { step: 2, text: "Download the ADT VS Code Extension (.vsix)" },
                                    { step: 3, text: "Install and paste the ID into the extension HUD" },
                                    { step: 4, text: "Start coding to begin continuous mirroring" }
                                ].map((item) => (
                                    <div key={item.step} className="flex gap-4 items-center">
                                        <span className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-blue-400">{item.step}</span>
                                        <p className="text-xs text-gray-300">{item.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <a href="/downloads/adt-extension.vsix" className="btn-large mb-4 w-full flex items-center justify-center gap-2">
                            <Download size={18} /> Download Extension
                        </a>
                        
                        <button className="btn-text mx-auto mt-4" onClick={() => router.push('/login?role=developer')}>
                            Proceed to Live Mirror <ArrowRight size={14} className="ml-1" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
