---
tags: [yet-to-implement, p2, simulation-mode]
status: pending
priority: P2
estimate: 2 days
---

# Simulation — Scripted Demo Driver

## Why
Beyond browser-driven sim, we sometimes need a backend-only driver (e.g., for CI smoke of the full pipeline).

## Acceptance criteria
- [ ] `python scripts/sim/run_recipe.py <recipe.json>` triggers the same flow
- [ ] Uses the sim tenant via mode header
- [ ] Asserts dashboard state at each step (queries `/thg/skills/{persona}`)
- [ ] Used in CI for E2E pipeline smoke

## Files involved
- `scripts/sim/run_recipe.py` (new)

## Tracked from
[[11 - Simulation Mode/Sim Mode - Architecture]]
