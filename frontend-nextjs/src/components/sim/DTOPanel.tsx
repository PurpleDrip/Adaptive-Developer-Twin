'use client';

import React, { useRef, useEffect } from 'react';
import type { DTOEvent, PipelineNodeId } from '@/lib/sim/types';

const NODE_COLOR: Record<PipelineNodeId, string> = {
  IDE:  '#4ec9b0',
  GW:   '#dcdcaa',
  TEL:  '#c586c0',
  FUS:  '#7c6fe0',
  THG:  '#e05fa0',
  DASH: '#9cdcfe',
};

const NODE_LABEL: Record<PipelineNodeId, string> = {
  IDE:  'VS Code Extension',
  GW:   'API Gateway',
  TEL:  'Telemetry Service',
  FUS:  'Fusion Engine',
  THG:  'Talent Graph',
  DASH: 'Dashboard WS',
};

interface JsonLineProps {
  k: string;
  v: string | number | boolean;
  isLast: boolean;
}

function JsonLine({ k, v, isLast }: JsonLineProps) {
  let valColor: string;
  let display: string;

  if (typeof v === 'string') {
    valColor = (v === 'BLOCKED' || v === 'ZERO_VARIANCE') ? '#f38ba8' : '#a6e3a1';
    display = `"${v}"`;
  } else if (typeof v === 'number') {
    valColor = '#fab387';
    display = String(v);
  } else {
    // boolean
    valColor = v ? '#cba6f7' : '#f38ba8';
    display = String(v);
  }

  return (
    <div style={{ paddingLeft: 14, lineHeight: '16px' }}>
      <span style={{ color: '#89b4fa' }}>"{k}"</span>
      <span style={{ color: '#3e4a62' }}>: </span>
      <span style={{ color: valColor }}>{display}</span>
      {!isLast && <span style={{ color: '#3e4a62' }}>,</span>}
    </div>
  );
}

interface Props {
  dtoLog: DTOEvent[];
}

export default function DTOPanel({ dtoLog }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevLen = useRef(0);

  useEffect(() => {
    if (dtoLog.length > prevLen.current && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
    prevLen.current = dtoLog.length;
  }, [dtoLog.length]);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      overflow: 'hidden',
      background: '#0b0d13',
      borderLeft: '1px solid rgba(255,255,255,0.06)',
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', 'Courier New', monospace",
    }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0,
        padding: '9px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(0,0,0,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: dtoLog.length > 0 ? '#7c6fe0' : '#2e3448',
            boxShadow: dtoLog.length > 0 ? '0 0 7px rgba(124,111,224,0.8)' : 'none',
            transition: 'all 400ms',
          }} />
          <span style={{
            fontSize: 9.5, fontWeight: 700,
            color: '#6870a0', letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            Payload Inspector
          </span>
        </div>
        {dtoLog.length > 0 && (
          <span style={{
            fontSize: 8, color: '#4a5268',
            background: 'rgba(124,111,224,0.08)',
            border: '1px solid rgba(124,111,224,0.15)',
            borderRadius: 3, padding: '1px 7px',
          }}>
            {dtoLog.length} event{dtoLog.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* ── Node legend ─────────────────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0,
        padding: '5px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        background: 'rgba(0,0,0,0.15)',
        display: 'flex', flexWrap: 'wrap', gap: '3px 10px',
      }}>
        {(Object.entries(NODE_COLOR) as [PipelineNodeId, string][]).map(([node, color]) => (
          <span key={node} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%',
              background: color, display: 'inline-block', flexShrink: 0,
            }} />
            <span style={{ fontSize: 7.5, color: '#3a4260', letterSpacing: '0.04em' }}>{node}</span>
          </span>
        ))}
      </div>

      {/* ── Empty state ─────────────────────────────────────────────────────── */}
      {dtoLog.length === 0 && (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 10,
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
            stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" strokeLinecap="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <span style={{ fontSize: 9, color: '#2a3045', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Awaiting telemetry
          </span>
        </div>
      )}

      {/* ── Event feed ──────────────────────────────────────────────────────── */}
      {dtoLog.length > 0 && (
        <div
          ref={scrollRef}
          style={{
            flex: 1, overflowY: 'auto',
            padding: '8px 8px',
            display: 'flex', flexDirection: 'column', gap: 6,
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(124,111,224,0.2) transparent',
          }}
        >
          {dtoLog.map((evt, idx) => {
            const isLatest = idx === 0;
            const entries = Object.entries(evt.payload);
            const opacity = Math.max(0.22, 1 - idx * 0.09);

            return (
              <div key={evt.id} style={{
                borderRadius: 5,
                border: `1px solid ${
                  evt.fraud
                    ? 'rgba(224,95,160,0.45)'
                    : isLatest
                      ? 'rgba(124,111,224,0.5)'
                      : 'rgba(255,255,255,0.05)'
                }`,
                background: evt.fraud
                  ? 'rgba(224,95,160,0.05)'
                  : isLatest
                    ? 'rgba(124,111,224,0.06)'
                    : 'rgba(255,255,255,0.015)',
                overflow: 'hidden',
                opacity,
                transition: 'opacity 400ms ease',
              }}>

                {/* Card header */}
                <div style={{
                  padding: '5px 9px',
                  background: 'rgba(0,0,0,0.35)',
                  borderBottom: `1px solid ${evt.fraud ? 'rgba(224,95,160,0.15)' : 'rgba(255,255,255,0.04)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: NODE_COLOR[evt.from], letterSpacing: '0.04em' }}>
                      {evt.from}
                    </span>
                    <span style={{ fontSize: 8, color: '#2a3045' }}>→</span>
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: NODE_COLOR[evt.to], letterSpacing: '0.04em' }}>
                      {evt.to}
                    </span>
                    {evt.fraud && (
                      <span style={{
                        marginLeft: 4, fontSize: 7.5, fontWeight: 700,
                        color: '#e05fa0',
                        background: 'rgba(224,95,160,0.15)',
                        borderRadius: 2, padding: '1px 5px', letterSpacing: '0.07em',
                      }}>
                        FRAUD
                      </span>
                    )}
                  </div>
                  <span style={{
                    fontSize: 8, color: isLatest ? '#4a5268' : '#252c3e',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    maxWidth: 130,
                  }}>
                    {evt.method}
                  </span>
                </div>

                {/* JSON payload */}
                <div style={{ padding: '7px 9px', fontSize: 9.5 }}>
                  <div style={{ color: '#2e3650', lineHeight: '16px' }}>{'{'}</div>
                  {entries.map(([k, v], i) => (
                    <JsonLine key={k} k={k} v={v} isLast={i === entries.length - 1} />
                  ))}
                  <div style={{ color: '#2e3650', lineHeight: '16px' }}>{'}'}</div>
                </div>

                {/* Footer: full service names */}
                <div style={{
                  padding: '3px 9px 5px',
                  borderTop: '1px solid rgba(255,255,255,0.025)',
                  fontSize: 7.5, color: '#252c3e',
                  display: 'flex', alignItems: 'center', gap: 3,
                  letterSpacing: '0.02em',
                }}>
                  <span style={{ color: NODE_COLOR[evt.from], opacity: 0.4 }}>●</span>
                  {NODE_LABEL[evt.from]}
                  <span style={{ color: '#1a2030' }}>→</span>
                  <span style={{ color: NODE_COLOR[evt.to], opacity: 0.4 }}>●</span>
                  {NODE_LABEL[evt.to]}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
