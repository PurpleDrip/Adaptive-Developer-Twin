'use client';

import React, { useEffect, useRef } from 'react';
import type { Particle, PipelineNodeId, FusionLabel } from '@/lib/sim/types';

// ── Node layout in a 300×520 SVG ─────────────────────────────────────────────
const NODE_POS: Record<PipelineNodeId, { x: number; y: number }> = {
  IDE:  { x: 150, y: 50  },
  GW:   { x: 150, y: 130 },
  TEL:  { x: 150, y: 210 },
  FUS:  { x: 150, y: 310 },
  THG:  { x: 150, y: 395 },
  DASH: { x: 150, y: 475 },
};

const NODE_LABELS: Record<PipelineNodeId, string> = {
  IDE:  'IDE',
  GW:   'Gateway',
  TEL:  'Telemetry',
  FUS:  'Fusion',
  THG:  'THG',
  DASH: 'Dashboard',
};

const EDGES: Array<[PipelineNodeId, PipelineNodeId]> = [
  ['IDE', 'GW'],
  ['GW', 'TEL'],
  ['TEL', 'FUS'],
  ['FUS', 'THG'],
  ['THG', 'DASH'],
];

const NODE_W = 90;
const NODE_H = 28;

function nodeRect(id: PipelineNodeId) {
  const { x, y } = NODE_POS[id];
  return { x: x - NODE_W / 2, y: y - NODE_H / 2, w: NODE_W, h: NODE_H };
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

interface Props {
  activeNode: PipelineNodeId | null;
  particles: Particle[];
  fusionLabel: FusionLabel | null;
  batchBubble: string | null;
  onParticleTick: (updatedParticles: Particle[]) => void;
}

export default function PipelinePanel({
  activeNode, particles, fusionLabel, batchBubble, onParticleTick,
}: Props) {
  const rafRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>(particles);

  useEffect(() => {
    particlesRef.current = particles;
  }, [particles]);

  // RAF loop: advance particles
  useEffect(() => {
    let last = performance.now();

    function tick(now: number) {
      const dt = (now - last) / 1000;
      last = now;
      const current = particlesRef.current;
      if (current.length === 0) { rafRef.current = requestAnimationFrame(tick); return; }

      const updated = current
        .map(p => ({ ...p, progress: Math.min(1, p.progress + dt / 0.5) }))
        .filter(p => p.progress < 1);

      if (updated.length !== current.length || current.some((p, i) => updated[i]?.progress !== p.progress)) {
        onParticleTick(updated);
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
  }, [onParticleTick]);

  function getParticleXY(p: Particle) {
    const from = NODE_POS[p.from];
    const to = NODE_POS[p.to];
    return {
      cx: lerp(from.x, to.x, p.progress),
      cy: lerp(from.y + NODE_H / 2, to.y - NODE_H / 2, p.progress),
    };
  }

  const isFraud = fusionLabel?.fraud ?? false;
  const fusionActive = fusionLabel !== null;

  return (
    <div className="flex flex-col h-full" style={{ background: '#0d0f14', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
      <div style={{ padding: '12px 16px 0', fontSize: 10, letterSpacing: '0.06em', color: '#5a6480', textTransform: 'uppercase', fontWeight: 600, flexShrink: 0 }}>
        Pipeline · Live View
      </div>

      <div className="flex-1 flex items-center justify-center" style={{ overflow: 'hidden' }}>
        <svg viewBox="0 0 300 540" width="300" height="520" style={{ overflow: 'visible' }}>

          {/* ── Edges ── */}
          {EDGES.map(([from, to]) => {
            const f = NODE_POS[from];
            const t = NODE_POS[to];
            const isTelFus = from === 'TEL' && to === 'FUS';
            const isFusTHG = from === 'FUS' && to === 'THG';
            const fraudBlocked = isFusTHG && isFraud && fusionActive;

            return (
              <line
                key={`${from}-${to}`}
                x1={f.x} y1={f.y + NODE_H / 2}
                x2={t.x} y2={t.y - NODE_H / 2}
                stroke={fraudBlocked ? 'rgba(224,95,95,0.3)' : (isTelFus ? 'rgba(124,111,224,0.4)' : 'rgba(255,255,255,0.12)')}
                strokeWidth={1.5}
                strokeDasharray={isTelFus ? '4 3' : '5 3'}
              />
            );
          })}

          {/* ── Batch bubble (TEL → FUS gap) ── */}
          {batchBubble && (
            <g>
              <rect x={70} y={255} width={160} height={28} rx={6}
                fill="rgba(124,111,224,0.12)" stroke="rgba(124,111,224,0.4)" strokeWidth={1} />
              <text x={150} y={268} textAnchor="middle" fontSize={9} fill="#a09ad8" fontFamily="monospace" dominantBaseline="middle">
                ◷ {batchBubble}
              </text>
              <text x={150} y={278} textAnchor="middle" fontSize={8} fill="#6a6490" fontFamily="monospace" dominantBaseline="middle">
                5 pings · alice@sim
              </text>
            </g>
          )}

          {/* ── Nodes ── */}
          {(Object.keys(NODE_POS) as PipelineNodeId[]).map(id => {
            const { x, y, w, h } = nodeRect(id);
            const isActive = activeNode === id;
            const isFus = id === 'FUS';
            const isTHGBlocked = id === 'THG' && isFraud && fusionActive;
            const isDash = id === 'DASH';

            let nodeStroke = isActive ? '#7c6fe0' : 'rgba(255,255,255,0.12)';
            let nodeFill = isActive ? 'rgba(124,111,224,0.15)' : '#171923';
            let nodeOpacity = 1;

            if (isTHGBlocked) { nodeStroke = 'rgba(224,95,95,0.3)'; nodeFill = 'rgba(30,20,20,0.8)'; nodeOpacity = 0.4; }
            if (isFus && fusionActive) { nodeStroke = isFraud ? '#e05f5f' : '#7c6fe0'; nodeFill = isFraud ? 'rgba(224,95,95,0.12)' : 'rgba(124,111,224,0.18)'; }

            return (
              <g key={id} opacity={nodeOpacity}>
                {/* Glow ring when active */}
                {isActive && (
                  <rect x={x - 3} y={y - 3} width={w + 6} height={h + 6} rx={17}
                    fill="none" stroke="rgba(124,111,224,0.25)" strokeWidth={3} />
                )}
                <rect x={x} y={y} width={w} height={h} rx={14}
                  fill={nodeFill} stroke={nodeStroke} strokeWidth={1.5} />
                {/* X for THG blocked */}
                {isTHGBlocked && (
                  <text x={x + w - 14} y={y + h / 2} fontSize={11} fill="#e05f5f" dominantBaseline="middle" fontWeight="bold">✕</text>
                )}
                <text x={x + w / 2} y={y + h / 2} textAnchor="middle" dominantBaseline="middle"
                  fontSize={10} fill={isActive ? '#cdd6f4' : '#8890aa'}
                  fontFamily="system-ui, sans-serif" fontWeight={600} letterSpacing="0.04em">
                  {NODE_LABELS[id]}
                </text>
              </g>
            );
          })}

          {/* ── Particles ── */}
          {particles.map(p => {
            const { cx, cy } = getParticleXY(p);
            const color = p.fraud ? '#e05f5f' : '#7c6fe0';
            return (
              <circle key={p.id} cx={cx} cy={cy} r={5} fill={color}
                filter={`drop-shadow(0 0 4px ${color})`} />
            );
          })}

          {/* ── Fusion result label ── */}
          {fusionLabel && (
            <g>
              <rect x={30} y={344} width={240} height={46} rx={6}
                fill={isFraud ? 'rgba(224,95,95,0.08)' : 'rgba(124,111,224,0.08)'}
                stroke={isFraud ? 'rgba(224,95,95,0.3)' : 'rgba(124,111,224,0.3)'}
                strokeWidth={1} />
              <text x={150} y={358} textAnchor="middle" fontSize={9} fontFamily="monospace" dominantBaseline="middle"
                fill={isFraud ? '#e05f5f' : '#a09ad8'}>
                Fusion · v2.0-top-tier
              </text>
              <text x={150} y={372} textAnchor="middle" fontSize={9} fontFamily="monospace" dominantBaseline="middle"
                fill={isFraud ? '#e05f5f' : '#7c6fe0'}>
                {isFraud
                  ? `reliability: ${fusionLabel.reliability.toFixed(2)} ⚠  fraud_flag triggered`
                  : `reliability: ${fusionLabel.reliability.toFixed(2)} ✓  ${
                      Object.entries(fusionLabel.updates)
                        .map(([s, d]) => `${s} +${(d as number).toFixed(2)}`)
                        .join(' · ')
                    }`
                }
              </text>
              <text x={150} y={384} textAnchor="middle" fontSize={8} fontFamily="monospace" dominantBaseline="middle"
                fill="#5a6480">
                {isFraud ? '⟶ THG write blocked' : '⟶ THG write queued'}
              </text>
            </g>
          )}

        </svg>
      </div>

      {/* Footer stats */}
      <div style={{
        height: 36, borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', paddingLeft: 16, paddingRight: 16,
        fontSize: 10, color: '#5a6480', gap: 16, flexShrink: 0,
        justifyContent: 'space-between',
      }}>
        <span>6 services · Neo4j + MongoDB</span>
        <span style={{ color: '#7c6fe0' }}>Async Redis WS ●</span>
      </div>
    </div>
  );
}
