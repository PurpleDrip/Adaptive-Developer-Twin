---
tags: [simulation-mode, ux]
status: implemented
---

# Sim Mode — Screen Choreography

## Implementation status: ✅ Done

Entry: `frontend-nextjs/src/app/sim/page.tsx`
Orchestrator: `frontend-nextjs/src/components/sim/SimDemo.tsx`

---

## The layout (implemented)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  TOP BAR · ADT · LIVE DEMO  [alice · sim]  [⏮ ⏸▶ ⏭ ↻]   [SIM MODE badge]  │  52px
├──────────────────────┬─────────────────────────────┬──────────────────────────┤
│                      │                             │                          │
│   IDE PANEL          │   PIPELINE PANEL            │   DASHBOARD PANEL        │
│   38fr               │   32fr                      │   30fr                   │
│                      │                             │                          │
│   VS Code lookalike  │   SVG · 300×540px           │   Persona card           │
│   Python/TS code     │   6 nodes + particles       │   Radar chart            │
│   LIVE badge         │   Fusion label              │   Skill bars             │
│   Status bar         │   Batch bubble              │   Ticker                 │
│                      │                             │                          │
├──────────────────────┴─────────────────────────────┴──────────────────────────┤
│  BOTTOM BAR · [●●●●●●●] Step 3 of 7  Caption text  ...   ADT v1              │  56px
└──────────────────────────────────────────────────────────────────────────────┘
```

CSS grid: `grid-template-columns: 38fr 32fr 30fr`

Background: `#0d0f14` (near-black, reads well on projectors)

Column dividers: `1px solid rgba(255,255,255,0.07)`

## Top bar (52px)

Left: ADT wordmark + gradient-text "LIVE DEMO" tag + brand logo square

Center: Persona chip (pill with `● Name · sim`)

Right: `⏮ ⏸/▶ ⏭ ↻` playback controls + **SIM MODE · data synthetic** gradient badge

## Bottom bar (56px)

Left: `Step N of 7` counter + 7 progress dots (active dot is wider, pill-shaped)

Center: narrator caption at 12px `#a0a8b8`

Right: `ADT v1 · Adaptive Developer Twin` credit

## Beat sheet (per step)

Steps advance automatically when `playing: true`. Between steps, `SimDemo.runStep()` awaits `step.durationMs * 0.4` before calling `runStep(idx + 1)`.

```
Step 1 (5s)   — Alice opens file, IDE panel highlights
Step 2 (12s)  — Typing + 5 pings → IDE→GW→TEL particles
Step 3 (8s)   — Batch fires, TEL→FUS→THG particles, fusion label, skill update
Step 4 (6s)   — THG highlighted (blend + decay narration)
Step 5 (5s)   — DASH highlighted, radar has morphed
Step 6 (10s)  — Bob, fraud scenario, red FUS node, THG blocked
Step 7 (6s)   — All nodes highlighted sequentially (system integrity message)
```

## Motion budget (implemented)

| Element | Duration | Mechanism |
|:--------|:--------:|:---------|
| Particle travel (one edge) | 500ms | RAF progress 0→1 |
| Node pulse (glow ring) | CSS border + shadow | instant on prop change |
| Radar morph | ~350ms | recharts interpolation |
| Skill bar width | 350ms | CSS `transition: width 350ms ease-out` |
| Caption change | instant | no fade in Phase 1 |
| Particle spawn to next | ~500–700ms gap | `await sleep()` in runStep |

## Particle system (implemented)

```ts
interface Particle {
  id: string;         // uid()
  from: PipelineNodeId;
  to: PipelineNodeId;
  progress: number;   // 0–1, advanced by RAF
  fraud: boolean;     // blue vs red
}
```

`PipelinePanel` runs a `requestAnimationFrame` loop that increments `progress` by `dt / 0.5` (full traverse in 500ms) and calls `onParticleTick` to propagate to `SimDemo` state. Particle position is linear interpolation between node centers:

```ts
cx = lerp(from.x, to.x, p.progress)
cy = lerp(from.y + NODE_H/2, to.y - NODE_H/2, p.progress)
```

Particle color: brand purple (`#7c6fe0`) for normal, danger red (`#e05f5f`) for fraud.

## Playback controls

| Control | Behavior |
|:--------|:---------|
| `▶ Play` | calls `runStep(state.stepIdx)`, sets `playing: true` |
| `⏸ Pause` | sets `stopRef.current = true`, `playing: false` |
| `⏭ Next` | stops current step, jumps to `stepIdx + 1`, resets transient state |
| `⏮ Prev` | same but `stepIdx - 1` |
| `↻ Restart` | full reset to `INITIAL_STATE` |

`stopRef` is a `useRef` (not state) so cancellation happens synchronously without triggering re-renders.

## Sub-pages

- [[Sim Mode - Embedded IDE Panel]] — custom tokenizer, typing engine
- [[Sim Mode - Telemetry Stream]] — ping/batch logic
- [[Sim Mode - Fusion Live View]] — SVG label implementation
- [[Sim Mode - THG Live Update]] — skill math, ticker
- [[Sim Mode - Dashboard Reflection]] — recharts radar
- [[Sim Mode - Investor Script]] — the 7-step recipe
