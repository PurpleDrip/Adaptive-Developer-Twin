---
tags: [simulation-mode]
status: implemented
---

# Sim Mode — THG Live Update

## Implementation status: ✅ Done

File: `frontend-nextjs/src/components/sim/PipelinePanel.tsx` (THG node)
Skill update logic: `frontend-nextjs/src/lib/sim/demoScript.ts` → `applyDeltas()`

---

## What's shown — pipeline panel

The `THG` pill node in the SVG pipeline:

- **Pulses** (glow ring, border turns `#7c6fe0`) when a `FUS→THG` particle arrives
- In the **fraud scenario**, opacity drops to `0.3` and a `✕` badge renders, signalling the write was blocked

The THG panel does **not** render the mini xyflow graph described in the original design spec. Phase 1 keeps it as the styled pill + glow ring to keep the panel readable at the 32% column width. The mini-graph is planned for Phase 2.

## What's shown — dashboard panel

The skill update is the primary payoff: `DashboardPanel.tsx` receives the updated `SkillMap` and re-renders:

1. **Radar polygon** morphs — recharts re-renders with new data values; Tailwind transition on bar widths provides the 350ms ease-out
2. **Skill bars** widen smoothly (CSS `transition: width 350ms ease-out`)
3. **Ticker** shows the last 3 skill changes with before/after values and delta

## Blend math (Phase 1)

Phase 1 applies deltas as simple addition (matches the non-decay case of the real blend formula):

```ts
// demoScript.ts
export function applyDeltas(base: SkillMap, deltas: Partial<Record<SkillName, number>>): SkillMap {
  const result = { ...base };
  for (const [skill, delta] of Object.entries(deltas)) {
    result[skill as SkillName] = Math.min(1, Math.max(0, result[skill as SkillName] + delta));
  }
  return result;
}
```

Phase 2 will call the real THG `/update` endpoint, which applies the Bayesian blend + temporal decay.

## State flow

```
SimDemo.runStep()
  → applyDeltas(prev.skills, step.skillDeltas)
  → setState({ skills: newSkills, ticker: newTicker })
  → DashboardPanel re-renders with new skills prop
```

The ticker is prepended (new changes at top):

```ts
const newTicker: TickerEntry[] = [
  ...Object.entries(step.skillDeltas).map(([s, d]) => ({
    skill: s as SkillName,
    before: prev.skills[s],
    after: prev.skills[s] + d,
  })),
  ...prev.ticker,
].slice(0, 3);
```

## Real-mode comparison

Real update math: [[02 - System Architecture/Data Flow - Skill Update]] and [[07 - Algorithms/Temporal Decay Model]].

The numbers shown in the sim (0.78 → 0.82) are pre-tuned in `demoScript.ts` to tell a convincing story. In real mode, the same numbers emerge from the actual CodeBERT + Bayesian posterior — they just vary per developer.
