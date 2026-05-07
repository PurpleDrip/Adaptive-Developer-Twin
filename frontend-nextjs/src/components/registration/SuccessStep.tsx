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
    const [copied, setCopied] = React.useState(false);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-[10px] text-gray-500 block uppercase font-bold tracking-widest">Connection Credential</label>
                                        {copied && <span className="text-[10px] text-green-500 font-bold animate-pulse">COPIED TO CLIPBOARD</span>}
                                    </div>
                                    <div 
                                        className="flex justify-between items-center bg-black p-4 rounded-xl border border-zinc-800 group hover:border-blue-500/50 transition-all cursor-pointer active:scale-[0.98]" 
                                        onClick={() => copyToClipboard(ids.extensionId)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${copied ? 'bg-green-500 animate-ping' : 'bg-blue-500'}`} />
                                            <code className="text-blue-400 font-mono text-sm tracking-wider">{ids.extensionId}</code>
                                        </div>
                                        <Copy size={16} className={`transition-colors ${copied ? 'text-green-500' : 'text-zinc-500 group-hover:text-white'}`} />
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
                                        <span className="w-6 h-6 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-bold text-blue-500">{item.step}</span>
                                        <p className="text-xs text-zinc-400">{item.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <a href="/downloads/adt-extension.vsix" className="btn-large mb-4 w-full flex items-center justify-center gap-2 group cursor-pointer">
                            <Download size={18} className="group-hover:translate-y-0.5 transition-transform" /> Download Extension
                        </a>
                        
                        <button className="btn-text mx-auto mt-4 cursor-pointer hover:text-white" onClick={() => router.push('/login?role=developer')}>
                            Proceed to Live Mirror <ArrowRight size={14} className="ml-1" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
