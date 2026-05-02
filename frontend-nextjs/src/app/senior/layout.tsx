'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, ClipboardList, Activity } from 'lucide-react';

const Sidebar = () => {
  const pathname = usePathname();
  const isActive = (path: string) => pathname.startsWith(path);

  return (
    <div className="w-72 border-r border-zinc-800 flex flex-col h-screen sticky top-0 bg-black">
      <div className="p-8 flex items-center gap-3">
        <Activity className="text-blue-500" />
        <span className="gradient-text text-xl">ADT v1</span>
      </div>
      
      <nav className="flex-1 px-4 py-8 space-y-2">
        <Link 
          href="/dashboard" 
          className={`flex items-center gap-3 p-4 rounded-xl transition-all ${
            isActive('/dashboard') ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 'text-gray-500 hover:text-white'
          }`}
        >
          <LayoutDashboard size={20} /> <span className="font-semibold">My Twin</span>
        </Link>
        
        <Link 
          href="/hrm" 
          className={`flex items-center gap-3 p-4 rounded-xl transition-all ${
            isActive('/hrm') ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 'text-gray-500 hover:text-white'
          }`}
        >
          <Users size={20} /> <span className="font-semibold">HRM Panel</span>
        </Link>
        
        <Link 
          href="/senior" 
          className={`flex items-center gap-3 p-4 rounded-xl transition-all ${
            isActive('/senior') ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 'text-gray-500 hover:text-white'
          }`}
        >
          <ClipboardList size={20} /> <span className="font-semibold">Orchestration</span>
        </Link>
      </nav>

      <div className="p-6 border-t border-zinc-800">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center font-bold">SV</div>
          <div>
            <p className="text-sm font-bold">Shashanth Vemuri</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Senior Architect</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex bg-black">
      <Sidebar />
      <div className="flex-1">
        <header className="h-20 border-b border-zinc-800 flex items-center justify-between px-10">
          <div className="max-w-md w-full">
            <input 
              type="text" 
              placeholder="Search twin data..." 
              className="w-full bg-zinc-900 border border-zinc-800 p-2 px-4 rounded-full text-sm outline-none focus:border-blue-500/50" 
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="px-3 py-1 bg-green-500/10 text-green-500 text-[10px] font-bold uppercase rounded-full border border-green-500/20 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Monitoring Active
            </div>
          </div>
        </header>
        <main className="p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
