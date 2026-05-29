'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, UserPlus, ArrowLeft } from 'lucide-react';

export default function DeveloperOnboarding() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-black bg-[radial-gradient(circle_at_bottom_left,rgba(139,92,246,0.1),transparent)]">
      <div className="max-w-4xl w-full text-center animate-fade">
        <button className="btn-text mx-auto" onClick={() => router.push('/')}>
          <ArrowLeft size={16} /> Back to Role Selection
        </button>
        
        <h2 className="text-5xl font-extrabold gradient-text mb-2">Developer Onboarding</h2>
        <p className="text-gray-400 text-xl mb-12">Are you new here or returning to your twin?</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          <div 
            className="p-10 cursor-pointer glass-card group hover:border-blue-500 transition-all"
            onClick={() => router.push('/login?role=developer')}
          >
            <LogIn size={48} className="text-blue-500 mb-6 mx-auto group-hover:scale-110 transition-transform" />
            <h3 className="text-2xl font-bold mb-2">Existing User</h3>
            <p className="text-gray-400 text-sm">Login to access your dashboard and skills graph.</p>
          </div>

          <div 
            className="p-10 cursor-pointer glass-card group hover:border-purple-500 transition-all"
            onClick={() => router.push('/register')}
          >
            <UserPlus size={48} className="text-purple-500 mb-6 mx-auto group-hover:scale-110 transition-transform" />
            <h3 className="text-2xl font-bold mb-2">New Developer</h3>
            <p className="text-gray-400 text-sm">Create your profile and generate your Extension ID.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
