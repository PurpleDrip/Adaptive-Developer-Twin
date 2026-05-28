'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import IDEPanel from './IDEPanel';
import PipelinePanel from './PipelinePanel';
import DTOPanel from './DTOPanel';
import { DEMO_STEPS, PERSONAS, applyDeltas } from '@/lib/sim/demoScript';
import type { Particle, PipelineNodeId, FusionLabel, TickerEntry, SkillMap, SimState, DTOEvent } from '@/lib/sim/types';
import { SkipBack, SkipForward, Play, Pause, RotateCcw } from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────
function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

const HOP_METHOD: Record<string, string> = {
  'IDE-GW':   'POST /api/v1/events/emit',
  'GW-TEL':   'telemetry.ingest()',
  'TEL-FUS':  'POST /api/v1/fusion/batch',
  'FUS-THG':  'thg.blend_skill_evidence()',
  'THG-DASH': 'ws.push_twin_update()',
};

function makeDTO(
  from: PipelineNodeId,
  to: PipelineNodeId,
  payload: Record<string, string | number | boolean>,
  fraud: boolean,
): DTOEvent {
  return { id: uid(), from, to, method: HOP_METHOD[`${from}-${to}`] ?? 'internal()', payload, fraud };
}

const INITIAL_SKILLS: SkillMap = { ...PERSONAS.alice.baseSkills };

const INITIAL_STATE: SimState = {
  stepIdx: 0,
  totalSteps: DEMO_STEPS.length,
  playing: false,
  caption: DEMO_STEPS[0].caption,
  persona: 'alice',
  displayedCode: '',
  fileName: 'app/routers/users.py',
  pingFlash: false,
  activeNode: null,
  particles: [],
  fusionLabel: null,
  batchBubble: null,
  skills: INITIAL_SKILLS,
  ticker: [],
};

export default function SimDemo() {
  const [state, setState] = useState<SimState>(INITIAL_STATE);
  const runningRef = useRef(false);
  const stopRef = useRef(false);

  // Convenience setter that merges partial state
  const patch = useCallback((partial: Partial<SimState>) => {
    setState(prev => ({ ...prev, ...partial }));
  }, []);

  const [dtoLog, setDtoLog] = useState<DTOEvent[]>([]);
  const emitDTO = useCallback((
    from: PipelineNodeId,
    to: PipelineNodeId,
    payload: Record<string, string | number | boolean>,
    fraud: boolean,
  ) => {
    setDtoLog(prev => [makeDTO(from, to, payload, fraud), ...prev].slice(0, 12));
  }, []);

  // ── Particle tick from PipelinePanel RAF ───────────────────────────────────
  const handleParticleTick = useCallback((updated: Particle[]) => {
    setState(prev => ({ ...prev, particles: updated }));
  }, []);

  // ── Step runner ────────────────────────────────────────────────────────────
  const runStep = useCallback(async (idx: number) => {
    if (idx >= DEMO_STEPS.length) { patch({ playing: false }); return; }
    const step = DEMO_STEPS[idx];
    const persona = PERSONAS[step.persona];

    patch({
      stepIdx: idx,
      caption: step.caption,
      persona: step.persona,
      activeNode: null,
      fusionLabel: null,
      batchBubble: null,
    });

    // Reset skills for persona switch (Bob starts fresh on his persona data)
    if (step.id === '06-fraud-bob') {
      patch({ skills: { ...PERSONAS.bob.baseSkills }, ticker: [] });
    }

    // 1 — Load file if the step specifies one
    if (step.file) {
      patch({
        fileName: step.file.name,
        displayedCode: step.file.initial,
      });
      await sleep(600);
    }
    if (stopRef.current) return;

    // 2 — Highlight initial nodes
    if (step.highlightNodes?.length) {
      patch({ activeNode: step.highlightNodes[0] as PipelineNodeId });
    }
    await sleep(800);
    if (stopRef.current) return;

    // 3 — Type text character by character
    if (step.typedText) {
      const baseCode = step.file?.initial ?? '';
      let typed = '';
      const chars = step.typedText.split('');
      const wpm = step.forceFraud ? 80 : 75;
      const msPerChar = 60_000 / (wpm * 5);

      for (let ci = 0; ci < chars.length; ci++) {
        if (stopRef.current) return;
        typed += chars[ci];
        const jitter = step.forceFraud ? 0 : (Math.random() * 40 - 20);
        const pause = chars[ci] === '\n' ? 180 : msPerChar + jitter;

        patch({ displayedCode: baseCode + typed, pingFlash: false });

        // Every ~25 chars emit a ping particle
        if (ci % 25 === 24) {
          patch({ pingFlash: true });
          setState(prev => ({
            ...prev,
            particles: [
              ...prev.particles,
              { id: uid(), from: 'IDE', to: 'GW', progress: 0, fraud: step.forceFraud ?? false },
            ],
          }));
          emitDTO('IDE', 'GW', {
            machine_id: 'sim-001-hwid',
            native_hwid: 'bios-6f4a2c1e',
            dev_id: persona.id,
            active_file: (step.file?.name ?? 'unknown').split('/').pop() ?? 'file',
            lang: lang,
            keystrokes: 25,
            commands_executed: step.forceFraud ? 0 : Math.floor(Math.random() * 3),
            wpm: step.forceFraud ? 80 : 75,
            entropy: step.forceFraud ? 0.01 : parseFloat((0.72 + Math.random() * 0.22).toFixed(2)),
            git_branch: 'main',
            code_snippet: typed.slice(-50).replace(/\n/g, ' ').trim(),
            sync_type: 'delta',
          }, step.forceFraud ?? false);
          await sleep(100);
          patch({ pingFlash: false });
          await sleep(400);
          // Chain GW → TEL
          if (!stopRef.current) {
            setState(prev => ({
              ...prev,
              particles: [
                ...prev.particles,
                { id: uid(), from: 'GW', to: 'TEL', progress: 0, fraud: step.forceFraud ?? false },
              ],
            }));
            emitDTO('GW', 'TEL', {
              schema_v: 'v1.1',
              validated: true,
              hwid_match: true,
              native_hwid_match: true,
              role_signed: true,
              wpm_ok: !(step.forceFraud ?? false),
              secret_scan: 'pass',
              forwarded_for: '10.0.0.1',
              x_trace_id: uid(),
            }, false);
          }
        }

        await sleep(pause);
      }
    }
    if (stopRef.current) return;

    // 4 — Batch + Fusion
    if (step.triggerBatch) {
      const batchId = `BATCH-${new Date().toISOString().slice(0, 16).replace(/[-T:]/g, '').slice(0, 12)}-${step.persona.slice(0, 4)}`;

      patch({ batchBubble: batchId, activeNode: 'TEL' });
      await sleep(1200);
      if (stopRef.current) return;

      // TEL → FUS particle
      setState(prev => ({
        ...prev,
        particles: [...prev.particles, { id: uid(), from: 'TEL', to: 'FUS', progress: 0, fraud: step.forceFraud ?? false }],
      }));
      emitDTO('TEL', 'FUS', {
        batch_id: batchId,
        window: 'SWEF-5min',
        events: Math.floor(2 + Math.random() * 4),
        algo: 'CodeBERT-base',
      }, step.forceFraud ?? false);
      patch({ activeNode: 'FUS' });
      await sleep(700);
      if (stopRef.current) return;

      // Show fusion label
      const fusionLabel: FusionLabel = {
        reliability: step.fusionReliability ?? 0.94,
        fraud: step.forceFraud ?? false,
        updates: step.skillDeltas ?? {},
      };
      patch({ fusionLabel, batchBubble: null });

      if (step.forceFraud) {
        emitDTO('FUS', 'THG', {
          reliability: step.fusionReliability ?? 0.31,
          fraud: true,
          flag: 'ZERO_VARIANCE',
          action: 'BLOCKED',
        }, true);
      }

      await sleep(1000);
      if (stopRef.current) return;

      if (!step.forceFraud && step.skillDeltas) {
        // FUS → THG particle
        setState(prev => ({
          ...prev,
          particles: [...prev.particles, { id: uid(), from: 'FUS', to: 'THG', progress: 0, fraud: false }],
        }));
        const deltaEntries = Object.entries(step.skillDeltas);
        const deltaPayload: Record<string, string | number | boolean> = {
          reliability: step.fusionReliability ?? 0.94,
          fraud: false,
        };
        for (const [k, v] of deltaEntries) {
          deltaPayload[k] = `+${(v as number).toFixed(2)}`;
        }
        emitDTO('FUS', 'THG', deltaPayload, false);
        patch({ activeNode: 'THG' });
        await sleep(700);
        if (stopRef.current) return;

        // Update skills + ticker
        setState(prev => {
          const newSkills = applyDeltas(prev.skills, step.skillDeltas!);
          const newTicker: TickerEntry[] = [
            ...Object.entries(step.skillDeltas!).map(([s, d]) => ({
              skill: s as keyof SkillMap,
              before: prev.skills[s as keyof SkillMap],
              after: prev.skills[s as keyof SkillMap] + (d as number),
            })),
            ...prev.ticker,
          ].slice(0, 3);
          return { ...prev, skills: newSkills, ticker: newTicker };
        });
        await sleep(700);
        if (stopRef.current) return;

        // THG → DASH particle
        setState(prev => ({
          ...prev,
          particles: [...prev.particles, { id: uid(), from: 'THG', to: 'DASH', progress: 0, fraud: false }],
        }));
        emitDTO('THG', 'DASH', {
          dev_id: persona.id,
          skills_updated: deltaEntries.length,
          graph_edges: 10 + Math.floor(Math.random() * 6),
          decay: false,
        }, false);
        patch({ activeNode: 'DASH' });
        await sleep(800);
      }
    }
    if (stopRef.current) return;

    // 5 — Step-7 all-green highlight
    if (step.showAuditHud) {
      const nodes: PipelineNodeId[] = ['IDE', 'GW', 'TEL', 'FUS', 'THG', 'DASH'];
      for (const n of nodes) {
        if (stopRef.current) return;
        patch({ activeNode: n });
        await sleep(350);
      }
    }

    // 6 — Linger, then auto-advance
    await sleep(step.durationMs * 0.4);
    if (stopRef.current) return;

    // Advance to next step
    runningRef.current = false;
    setState(prev => {
      if (!prev.playing) return prev;
      const next = idx + 1;
      if (next < DEMO_STEPS.length) return { ...prev };
      return { ...prev, playing: false };
    });

    if (idx + 1 < DEMO_STEPS.length) {
      await sleep(600);
      if (!stopRef.current) runStep(idx + 1);
    }
  }, [patch, emitDTO]);

  // ── Playback controls ──────────────────────────────────────────────────────
  const play = useCallback(() => {
    stopRef.current = false;
    runningRef.current = true;
    patch({ playing: true });
    runStep(state.stepIdx);
  }, [patch, runStep, state.stepIdx]);

  const pause = useCallback(() => {
    stopRef.current = true;
    runningRef.current = false;
    patch({ playing: false });
  }, [patch]);

  const goStep = useCallback((delta: number) => {
    stopRef.current = true;
    runningRef.current = false;
    const next = Math.max(0, Math.min(DEMO_STEPS.length - 1, state.stepIdx + delta));
    const step = DEMO_STEPS[next];
    patch({
      playing: false,
      stepIdx: next,
      caption: step.caption,
      persona: step.persona,
      activeNode: null,
      particles: [],
      fusionLabel: null,
      batchBubble: null,
      displayedCode: step.file?.initial ?? state.displayedCode,
      fileName: step.file?.name ?? state.fileName,
    });
  }, [state.stepIdx, state.displayedCode, state.fileName, patch]);

  const restart = useCallback(() => {
    stopRef.current = true;
    runningRef.current = false;
    setState({ ...INITIAL_STATE, skills: { ...PERSONAS.alice.baseSkills } });
    setDtoLog([]);
  }, []);

  // Stop RAF on unmount
  useEffect(() => {
    return () => { stopRef.current = true; };
  }, []);

  const step = DEMO_STEPS[state.stepIdx];
  const lang = step?.file?.lang ?? (state.fileName.endsWith('.tsx') ? 'typescript' : 'python');

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw',
      background: '#0d0f14', color: '#cdd6f4', overflow: 'hidden',
      fontFamily: "system-ui, -apple-system, 'Inter', sans-serif",
    }}>

      {/* ── TOP BAR ───────────────────────────────────────────────────────── */}
      <div style={{
        height: 52, flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', paddingLeft: 20, paddingRight: 20, gap: 16,
        background: '#0a0c12',
        backgroundImage: 'linear-gradient(90deg, rgba(124,111,224,0.08) 0%, transparent 60%)',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'linear-gradient(135deg, #7c6fe0, #e05fa0)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 800, color: '#fff',
          }}>A</div>
          <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.03em', color: '#cdd6f4' }}>ADT</span>
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>·</span>
          <span style={{ fontSize: 11, color: '#e05fa0', letterSpacing: '0.06em', fontWeight: 600 }}>LIVE DEMO</span>
        </div>

        {/* Persona chip */}
        <div style={{
          marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(124,111,224,0.1)', border: '1px solid rgba(124,111,224,0.25)',
          borderRadius: 20, padding: '4px 12px', fontSize: 11, color: '#a09ad8',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c6fe0', display: 'inline-block' }} />
          {PERSONAS[state.persona].name} · sim
        </div>

        {/* Playback controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 16 }}>
          <button onClick={() => goStep(-1)} title="Previous step"
            style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '5px 8px', color: '#8890aa', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <SkipBack size={14} />
          </button>
          {state.playing ? (
            <button onClick={pause} title="Pause"
              style={{ background: '#7c6fe0', border: 'none', borderRadius: 6, padding: '5px 12px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600 }}>
              <Pause size={13} /> Pause
            </button>
          ) : (
            <button onClick={play} title="Play"
              style={{ background: '#7c6fe0', border: 'none', borderRadius: 6, padding: '5px 12px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600 }}>
              <Play size={13} /> Play
            </button>
          )}
          <button onClick={() => goStep(1)} title="Next step"
            style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '5px 8px', color: '#8890aa', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <SkipForward size={14} />
          </button>
          <button onClick={restart} title="Restart"
            style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '5px 8px', color: '#8890aa', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <RotateCcw size={14} />
          </button>
        </div>

        {/* SIM badge */}
        <div style={{
          background: 'linear-gradient(90deg, #7c6fe0, #e05fa0)',
          borderRadius: 4, padding: '3px 10px',
          fontSize: 9, fontWeight: 700, color: '#fff', letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          SIM MODE · data synthetic
        </div>
      </div>

      {/* ── THREE COLUMNS ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '38fr 32fr 30fr', overflow: 'hidden' }}>

        {/* Left: IDE */}
        <IDEPanel
          fileName={state.fileName}
          code={state.displayedCode}
          pingFlash={state.pingFlash}
          isTyping={state.playing && !!step?.typedText}
          lang={lang}
        />

        {/* Center: Pipeline */}
        <PipelinePanel
          activeNode={state.activeNode}
          particles={state.particles}
          fusionLabel={state.fusionLabel}
          batchBubble={state.batchBubble}
          onParticleTick={handleParticleTick}
        />

        {/* Right: Payload Inspector */}
        <DTOPanel dtoLog={dtoLog} />
      </div>

      {/* ── BOTTOM BAR ────────────────────────────────────────────────────── */}
      <div style={{
        height: 56, flexShrink: 0,
        borderTop: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center',
        paddingLeft: 20, paddingRight: 20, gap: 16,
      }}>
        {/* Step counter */}
        <span style={{ fontSize: 11, color: '#5a6480', flexShrink: 0, minWidth: 70 }}>
          Step {state.stepIdx + 1} of {DEMO_STEPS.length}
        </span>

        {/* Step dots */}
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {DEMO_STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === state.stepIdx ? 18 : 6, height: 6, borderRadius: 3,
              background: i === state.stepIdx ? '#7c6fe0' : i < state.stepIdx ? 'rgba(124,111,224,0.4)' : 'rgba(255,255,255,0.1)',
              transition: 'all 300ms ease',
            }} />
          ))}
        </div>

        {/* Caption */}
        <div style={{
          flex: 1, fontSize: 12, color: '#a0a8b8',
          textAlign: 'center', lineHeight: 1.4,
        }}>
          {state.caption}
        </div>

        {/* Right badge */}
        <span style={{ fontSize: 10, color: '#4a5060', flexShrink: 0 }}>
          ADT v1 · Adaptive Developer Twin
        </span>
      </div>
    </div>
  );
}
