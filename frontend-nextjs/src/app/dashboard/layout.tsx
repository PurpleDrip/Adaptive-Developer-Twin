'use client';

import React, { useEffect, useState } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ name?: string; user_id?: string; role?: string } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('adt_user');
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'D';

  return (
    <div className="min-h-screen bg-black">
      <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-8 sticky top-0 bg-black/80 backdrop-blur-md z-30">
        <div className="px-3 py-1 bg-green-500/10 text-green-500 text-[10px] font-bold uppercase rounded-full border border-green-500/20 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          Monitoring Active
        </div>

        {/* Dev Identity */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block leading-tight">
            <p className="text-sm font-semibold text-white tracking-tight truncate max-w-[200px]">
              {user?.name || 'Developer'}
            </p>
            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
              {user?.user_id || '—'}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-[11px] text-white">
            {initials}
          </div>
        </div>
      </header>
      <main className="p-6 lg:p-10">
        {children}
      </main>
    </div>
  );
}
