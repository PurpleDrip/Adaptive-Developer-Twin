'use client';

import React, { useEffect, useState } from 'react';
import { Shield, ChevronDown } from 'lucide-react';

export default function ProjectManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<{ name?: string; user_id?: string; role?: string } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('adt_user');
      if (raw) setUser(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'M';

  return (
    <div className="min-h-screen bg-black">
      <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-8 sticky top-0 bg-black/80 backdrop-blur-md z-30">
        <div className="px-3 py-1 bg-green-500/10 text-green-500 text-[10px] font-bold uppercase rounded-full border border-green-500/20 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          Monitoring Active
        </div>

        {/* Manager Identity Chip */}
        <div className="group relative flex items-center gap-3 pl-4 pr-3 py-1.5 rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-900/80 to-zinc-900/40 hover:border-blue-500/40 hover:from-blue-500/5 hover:to-indigo-500/5 transition-all duration-300 cursor-default shadow-[0_2px_10px_rgba(0,0,0,0.4)]">
          {/* Glow accent */}
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-blue-500/0 via-blue-500/20 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm pointer-events-none" />

          <div className="relative flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="flex items-center gap-1.5 justify-end">
                <p className="text-sm font-bold text-white tracking-tight truncate max-w-[180px]">
                  {user?.name || 'Manager'}
                </p>
                <span className="px-1.5 py-0.5 bg-blue-500/15 border border-blue-500/30 rounded text-[8px] font-bold text-blue-400 uppercase tracking-widest leading-none">
                  {user?.role || 'manager'}
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 font-mono flex items-center gap-1.5 justify-end mt-0.5">
                <Shield size={9} className="text-blue-400/70" />
                <span>{user?.user_id || '—'}</span>
              </p>
            </div>

            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-xs text-white border-2 border-black shadow-lg shadow-blue-500/30">
                {initials}
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-black" />
            </div>

            <ChevronDown size={14} className="text-zinc-600 group-hover:text-zinc-400 transition-colors hidden sm:block" />
          </div>
        </div>
      </header>
      <main className="p-6 lg:p-10">
        {children}
      </main>
    </div>
  );
}
