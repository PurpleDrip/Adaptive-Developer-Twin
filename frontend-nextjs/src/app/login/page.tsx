'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn, Shield, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'developer';
  
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate navigation
    if (role === 'developer') router.push('/dashboard');
    else if (role === 'project_manager') router.push('/project-manager');
  };

  const roleTitles: Record<string, string> = {
    developer: "Developer Portal",
    project_manager: "Project Management Console"
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-black">
      <div className="max-w-md w-full p-10 glass-card animate-fade text-center">
        <button className="btn-text" onClick={() => router.back()}>
          <ArrowLeft size={16} /> Back
        </button>

        <h2 className="text-3xl font-extrabold gradient-text mb-2">{roleTitles[role]}</h2>
        <p className="text-gray-400 mb-8">Secure authentication required</p>

        <form onSubmit={handleLogin} className="space-y-6 text-left">
          <div>
            <label className="text-xs text-gray-500 block mb-2">Username</label>
            <input 
              className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-lg outline-none focus:border-blue-500"
              placeholder="Enter username" 
              required 
            />
          </div>
          
          <div>
            <label className="text-xs text-gray-500 block mb-2">Password</label>
            <input 
              type="password"
              className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-lg outline-none focus:border-blue-500"
              placeholder="••••••••" 
              required 
            />
          </div>

          <button type="submit" className="btn-large !mt-10">
            Sign In <LogIn size={18} />
          </button>
        </form>

        {role === 'project_manager' && (
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-500 italic">
            <Shield size={14} /> Credentials provided by Technical Support
          </div>
        )}
      </div>
    </div>
  );
}
