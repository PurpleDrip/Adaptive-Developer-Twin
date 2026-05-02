import React from 'react';
import { CheckCircle, Copy, Download, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SuccessStepProps {
    ids: { userId: string; extensionId: string };
}

export const SuccessStep: React.FC<SuccessStepProps> = ({ ids }) => {
    const router = useRouter();

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-black">
            <div className="max-w-lg w-full p-12 glass-card text-center animate-fade">
                <CheckCircle size={64} className="text-green-500 mx-auto mb-6" />
                <h2 className="text-3xl font-bold gradient-text mb-4">Twin Initialized!</h2>
                <p className="text-gray-400 mb-8">Your digital profile is now synced with the core engine.</p>
                
                <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 mb-6 text-left">
                    <p className="text-sm font-semibold text-blue-500 mb-4 uppercase tracking-wider">Connection Details</p>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">User ID</label>
                            <div className="flex justify-between items-center bg-black p-3 rounded border border-zinc-800">
                                <code className="text-blue-400">{ids.userId}</code>
                                <Copy size={16} className="text-gray-500 cursor-pointer hover:text-white" onClick={() => copyToClipboard(ids.userId)} />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">Extension ID</label>
                            <div className="flex justify-between items-center bg-black p-3 rounded border border-zinc-800">
                                <code className="text-purple-400">{ids.extensionId}</code>
                                <Copy size={16} className="text-gray-500 cursor-pointer hover:text-white" onClick={() => copyToClipboard(ids.extensionId)} />
                            </div>
                        </div>
                    </div>
                </div>

                <a href="/downloads/adt-extension.vsix" className="btn-large mb-4">
                    <Download size={18} /> Download Extension
                </a>
                
                <button className="btn-text mx-auto" onClick={() => router.push('/login?role=developer')}>
                    Go to Dashboard
                </button>
            </div>
        </div>
    );
};
