'use client';

import React, { useMemo } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from 'recharts';
import type { SkillMap, TickerEntry, PersonaId } from '@/lib/sim/types';
import { PERSONAS } from '@/lib/sim/demoScript';

interface DashboardPanelProps {
  persona: PersonaId;
  skills: SkillMap;
  ticker: TickerEntry[];
}

const SKILL_LABELS: Record<string, string> = {
  backend: 'Backend', frontend: 'Frontend', database: 'Database',
  ml: 'ML', devops: 'DevOps', security: 'Security', testing: 'Testing', neo4j: 'Neo4j',
};

export default function DashboardPanel({ persona, skills, ticker }: DashboardPanelProps) {
  const personaData = PERSONAS[persona];

  const radarData = useMemo(() => (
    Object.entries(skills).map(([key, val]) => ({
      subject: SKILL_LABELS[key] ?? key,
      value: Math.round(val * 100),
      fullMark: 100,
    }))
  ), [skills]);

  return (
    <div className="flex flex-col h-full" style={{ background: '#0d0f14' }}>
      <div style={{ padding: '12px 16px 0', fontSize: 10, letterSpacing: '0.06em', color: '#5a6480', textTransform: 'uppercase', fontWeight: 600, flexShrink: 0 }}>
        Developer Twin · Live
      </div>

      {/* Persona card */}
      <div style={{ padding: '12px 16px 8px', flexShrink: 0 }}>
        <div style={{
          background: '#171923', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10, padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #7c6fe0, #e05fa0)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: '#fff',
          }}>
            {personaData.initials}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#cdd6f4' }}>{personaData.name}</div>
            <div style={{ fontSize: 10, color: '#5a6480', marginTop: 1 }}>{personaData.domain}</div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: 9, color: '#5a6480' }}>Neural Twin</div>
            <div style={{ fontSize: 10, color: '#7c6fe0', marginTop: 1 }}>● Active</div>
          </div>
        </div>
      </div>

      {/* Radar chart */}
      <div style={{ flex: '0 0 220px', padding: '0 8px' }}>
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarData}>
            <PolarGrid stroke="rgba(255,255,255,0.08)" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: '#5a6480', fontSize: 9 }}
            />
            <Radar
              name="Skills"
              dataKey="value"
              stroke="#7c6fe0"
              fill="#7c6fe0"
              fillOpacity={0.22}
              strokeWidth={1.5}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Skill bars */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 8px' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.05em', color: '#5a6480', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
          Skill Strengths
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Object.entries(skills).map(([key, val]) => (
            <div key={key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 10, color: '#8890aa' }}>{SKILL_LABELS[key] ?? key}</span>
                <span style={{ fontSize: 10, color: '#7c6fe0', fontFamily: 'monospace' }}>{(val * 100).toFixed(0)}%</span>
              </div>
              <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${val * 100}%`,
                  background: 'linear-gradient(90deg, #7c6fe0, #a09ad8)',
                  borderRadius: 2, transition: 'width 350ms ease-out',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What just changed ticker */}
      <div style={{ flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.06)', padding: '8px 16px' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.05em', color: '#5a6480', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
          What just changed
        </div>
        {ticker.length === 0 ? (
          <div style={{ fontSize: 10, color: '#3a3f54', fontStyle: 'italic' }}>Waiting for first batch…</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {ticker.slice(0, 3).map((entry, i) => {
              const delta = entry.after - entry.before;
              const isPos = delta >= 0;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10 }}>
                  <span style={{ color: isPos ? '#7c6fe0' : '#e05f5f' }}>{isPos ? '▲' : '▼'}</span>
                  <span style={{ color: '#8890aa', flex: 1 }}>{SKILL_LABELS[entry.skill] ?? entry.skill}</span>
                  <span style={{ fontFamily: 'monospace', color: '#5a6480' }}>
                    {(entry.before * 100).toFixed(0)} → {(entry.after * 100).toFixed(0)}
                  </span>
                  <span style={{ fontFamily: 'monospace', color: isPos ? '#7c6fe0' : '#e05f5f', minWidth: 36, textAlign: 'right' }}>
                    {isPos ? '+' : ''}{(delta * 100).toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
