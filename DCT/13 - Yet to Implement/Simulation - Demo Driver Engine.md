---
tags: [yet-to-implement, p1, simulation-mode, frontend]
status: pending
priority: P1
estimate: 1 week
---

# Simulation — Demo Driver Engine

## Why
The scripted state machine that orchestrates a recipe.

## Acceptance criteria
- [ ] Loads a recipe JSON
- [ ] Step controls: Play/Pause/Next/Prev/Restart
- [ ] Auto-advance with configurable timing
- [ ] Emits sim events to the event bus (see [[11 - Simulation Mode/Sim Mode - Telemetry Stream]])
- [ ] Visualization layer subscribes
- [ ] Skip-ahead cancels in-flight delayed visualizations
- [ ] Tests: a 5-step recipe completes deterministically

## Files involved
- `frontend-nextjs/src/lib/sim/driver.ts` (new)
- `frontend-nextjs/src/lib/sim/event_bus.ts` (new)
- `frontend-nextjs/src/lib/sim/recipes/*.json`

## Tracked from
[[11 - Simulation Mode/Sim Mode - Architecture]] · [[11 - Simulation Mode/Sim Mode - Investor Script]]
