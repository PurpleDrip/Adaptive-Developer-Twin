'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Briefcase, ShieldCheck, ArrowRight } from 'lucide-react';
import { RoleCard } from '@/components/RoleCard';

export default function LandingPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const roles = [
    { id: 'developer', title: 'Developer', icon: <User size={40} />, desc: 'Register your twin and start the ladder climb.' },
    { id: 'senior_manager', title: 'Senior Manager', icon: <Briefcase size={40} />, desc: 'Orchestrate teams and optimize task allocation.' },
    { id: 'hrm', title: 'HRM', icon: <ShieldCheck size={40} />, desc: 'Monitor organizational health and prevent burnout.' }
  ];

  const handleProceed = () => {
    if (selectedRole === 'developer') {
      router.push('/onboarding/developer');
    } else {
      router.push(`/login?role=${selectedRole}`);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-10 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.1),transparent)]">
      <div className="max-w-4xl w-full text-center animate-fade">
        <h1 className="text-6xl font-extrabold gradient-text mb-2">Adaptive Developer Twin</h1>
        <p className="text-gray-400 text-xl mb-12">Select your role to enter the ecosystem</p>

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
