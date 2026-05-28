'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Briefcase, ShieldCheck, ArrowRight, Play } from 'lucide-react';
import { RoleCard } from '@/components/RoleCard';

export default function LandingPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const roles = [
    { id: 'developer', title: 'Developer', icon: <User size={40} />, desc: 'Register your twin and start the ladder climb.' },
    { id: 'project_manager', title: 'Project Manager', icon: <Briefcase size={40} />, desc: 'Orchestrate teams, track delivery, and optimize allocation.' },
    { id: 'tech', title: 'Tech Admin', icon: <ShieldCheck size={40} />, desc: 'System monitoring, audit logs, and infrastructure control.' }
  ];

  const handleProceed = () => {
    if (selectedRole === 'developer') {
      router.push('/onboarding/developer');
    } else if (selectedRole === 'tech') {
      router.push('/tech');
    } else {
      router.push(`/login?role=${selectedRole}`);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-10 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.1),transparent)]">
      <div className="max-w-4xl w-full text-center animate-fade">
        <h1 className="text-6xl font-extrabold text-blue-500 mb-2">Adaptive Developer Twin</h1>
        <p className="text-gray-400 text-xl mb-6">Select your role to enter the ecosystem</p>

        {/* Simulation Mode CTA */}
        <div className="mb-10 flex justify-center">
          <Link
            href="/sim"
            className="inline-flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
            style={{ background: 'linear-gradient(90deg, #7c6fe0, #e05fa0)', boxShadow: '0 0 24px rgba(124,111,224,0.35)' }}
          >
            <Play size={15} fill="currentColor" />
            Watch the Live Demo  ·  Simulation Mode
            <span style={{ fontSize: 10, opacity: 0.8, border: '1px solid rgba(255,255,255,0.3)', borderRadius: 4, padding: '1px 6px' }}>
              5 min
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {roles.map((role) => (
            <RoleCard
              key={role.id}
              id={role.id}
              title={role.title}
              desc={role.desc}
              icon={role.icon}
              active={selectedRole === role.id}
              onClick={() => setSelectedRole(role.id)}
            />
          ))}
        </div>

        {selectedRole && (
          <button
            className="btn-large max-w-sm mx-auto group animate-fade"
            onClick={handleProceed}
          >
            Proceed as {roles.find(r => r.id === selectedRole)?.title}
            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </button>
        )}
      </div>
    </main>
  );
}
