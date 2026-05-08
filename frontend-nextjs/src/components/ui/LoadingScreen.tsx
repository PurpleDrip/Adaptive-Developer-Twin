'use client';

import React from 'react';
import Image from 'next/image';

interface LoadingScreenProps {
  message?: string;
  subtitle?: string;
  accent?: 'blue' | 'cyan' | 'purple';
}

const ACCENT_MAP = {
  blue:   { ring: 'border-blue-500/40',   ring2: 'border-blue-400/20',   text: 'text-blue-400',   glow: 'bg-blue-500/20',   dot: 'bg-blue-400' },
  cyan:   { ring: 'border-cyan-500/40',   ring2: 'border-cyan-400/20',   text: 'text-cyan-400',   glow: 'bg-cyan-500/20',   dot: 'bg-cyan-400' },
  purple: { ring: 'border-purple-500/40', ring2: 'border-purple-400/20', text: 'text-purple-400', glow: 'bg-purple-500/20', dot: 'bg-purple-400' },
};

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Synchronizing neural twin',
  subtitle = 'Calibrating your THG profile…',
  accent = 'blue',
}) => {
  const a = ACCENT_MAP[accent];

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_50%,transparent_100%)]" />

      {/* Radial glow */}
      <div className={`absolute w-[500px] h-[500px] ${a.glow} rounded-full blur-[120px] opacity-40 animate-pulse`} />

      <div className="relative flex flex-col items-center gap-8">
        {/* Logo + concentric rings */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          {/* Outer ring — slow spin */}
          <div className={`absolute inset-0 rounded-full border ${a.ring2} border-dashed animate-[spin_8s_linear_infinite]`} />
          {/* Mid ring — counter-spin */}
          <div className={`absolute inset-3 rounded-full border-2 ${a.ring} border-t-transparent border-l-transparent animate-[spin_2.5s_linear_infinite_reverse]`} />
          {/* Inner glow halo */}
          <div className={`absolute inset-6 rounded-full ${a.glow} blur-2xl animate-pulse`} />

          {/* Logo with subtle breathing */}
          <div className="relative w-16 h-16 animate-[breathe_2.5s_ease-in-out_infinite]">
            <Image
              src="/white-logo.png"
              alt="ADT"
              fill
              priority
              sizes="64px"
              className="object-contain drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]"
            />
          </div>

          {/* Orbiting dots */}
          <div className="absolute inset-0 animate-[spin_4s_linear_infinite]">
            <span className={`absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 ${a.dot} rounded-full shadow-[0_0_10px_currentColor]`} />
          </div>
          <div className="absolute inset-0 animate-[spin_4s_linear_infinite_reverse]">
            <span className={`absolute top-1/2 -right-1 -translate-y-1/2 w-1 h-1 ${a.dot} rounded-full opacity-60`} />
          </div>
        </div>

        {/* Text */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-2">
            <span className={`text-base font-semibold tracking-tight ${a.text}`}>
              {message}
            </span>
            <span className="flex gap-0.5 mt-1">
              <span className={`w-1 h-1 rounded-full ${a.dot} animate-[blink_1.4s_infinite_0ms]`} />
              <span className={`w-1 h-1 rounded-full ${a.dot} animate-[blink_1.4s_infinite_200ms]`} />
              <span className={`w-1 h-1 rounded-full ${a.dot} animate-[blink_1.4s_infinite_400ms]`} />
            </span>
          </div>
          <p className="text-xs text-zinc-500 font-mono tracking-wider uppercase">
            {subtitle}
          </p>
        </div>

        {/* Progress bar — indeterminate sweep */}
        <div className="w-64 h-0.5 bg-zinc-900 rounded-full overflow-hidden">
          <div className={`h-full w-1/3 ${a.dot} rounded-full animate-[sweep_1.8s_ease-in-out_infinite]`} />
        </div>
      </div>

      <style jsx>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
        @keyframes blink {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
        @keyframes sweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
