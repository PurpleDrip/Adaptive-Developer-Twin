import React from 'react';
import { LucideIcon } from 'lucide-react';

interface RoleCardProps {
  id: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

export const RoleCard = ({ title, desc, icon, active, onClick }: RoleCardProps) => {
  return (
    <div 
      className={`p-10 cursor-pointer transition-all duration-300 glass-card text-center flex flex-col items-center gap-4 ${
        active ? 'border-blue-500 bg-blue-500/5' : 'hover:border-blue-500/50 hover:-translate-y-1'
      }`}
      onClick={onClick}
    >
      <div className="text-blue-500 mb-2">{icon}</div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
};
