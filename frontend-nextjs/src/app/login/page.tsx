"use client";

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn, Shield, ArrowLeft, Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api/auth';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'developer';

  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authApi.login(credentials);

      // Store in local storage and cookies for session persistence and middleware
      localStorage.setItem('adt_user', JSON.stringify(data));
      document.cookie = `adt_user=${encodeURIComponent(JSON.stringify(data))}; path=/; max-age=86400; SameSite=Lax`;

      if (data.role === 'developer') {
        router.push('/dashboard');
      } else if (data.role === 'manager' || data.role === 'PM') {
        router.push('/project-manager');
      } else {
        router.push('/tech/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Authentication failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const roleTitles: Record<string, string> = {
    developer: "Developer Portal",
    project_manager: "Project Management Console"
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-black">
      <div className="max-w-md w-full p-10 glass-card animate-fade text-center">
        <button className="btn-text" onClick={() => router.push('/')}>
          <ArrowLeft size={16} /> Back
        </button>

        <h2 className="text-3xl font-extrabold gradient-text mb-2">{roleTitles[role]}</h2>
        <p className="text-gray-400 mb-8">Secure authentication required</p>

        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-6 text-xs">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-6 text-left">
          <div>
            <label className="text-xs text-gray-500 block mb-2">Username</label>
            <input
              name="username"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-lg outline-none focus:border-blue-500"
              placeholder="Enter username"
              required
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-2">Password</label>
            <input
              name="password"
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-lg outline-none focus:border-blue-500"
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn-large !mt-10 flex items-center justify-center gap-2">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <>Sign In <LogIn size={18} /></>}
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
