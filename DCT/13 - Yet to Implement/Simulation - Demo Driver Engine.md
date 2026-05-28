---
tags: [yet-to-implement, p1, simulation-mode, frontend]
status: done
priority: P1
estimate: 1 week
completed: 2026-05-28
---

# Simulation — Demo Driver Engine

## Why
The scripted state machine that orchestrates a recipe.

## Acceptance criteria
- [x] Loads a recipe (DEMO_STEPS array in `demoScript.ts`)
- [x] Step controls: Play/Pause/Next/Prev/Restart
- [x] Auto-advance with configurable timing (`step.durationMs * 0.4` gap)
- [x] Visualization layer subscribes (direct React props — no event bus in Phase 1)
- [x] Skip-ahead cancels in-flight visualizations (`stopRef.current = true`)

## Decision: no event bus in Phase 1
`SimDemo.tsx` is the driver + event bus in one. State flows directly to child components as props. If Phase 2 needs a WS-based event bus, `SimDemo` can be refactored to subscribe to it without touching the panels.

## Files involved
- `frontend-nextjs/src/components/sim/SimDemo.tsx` ✅ (contains runStep, playback controls, all state)
- `frontend-nextjs/src/lib/sim/demoScript.ts` ✅ (DEMO_STEPS recipe)
- `frontend-nextjs/src/lib/sim/types.ts` ✅

## Tracked from
[[11 - Simulation Mode/Sim Mode - Architecture]] · [[11 - Simulation Mode/Sim Mode - Investor Script]]
