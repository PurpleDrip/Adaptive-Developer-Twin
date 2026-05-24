---
tags: [yet-to-implement, p1, simulation-mode]
status: pending
priority: P1
estimate: 4 days
---

# Simulation — Mode Switch + Seed Data

## Why
Sim Mode needs a sim tenant (or separate cluster) with pre-seeded personas.

## Acceptance criteria
- [ ] `mode` setting at request layer (header / cookie); enforced server-side
- [ ] Sim personas seeded via `scripts/seed_sim.py` (sim-alice, sim-bob, sim-carol, sim-dee)
- [ ] Their THG nodes, whitelist rows, telemetry baseline pre-populated
- [ ] Per-request `tenant=sim` enforced at every query
- [ ] Tests per [[11 - Simulation Mode/Safe-Mode Guarantees]] (esp. "sim never writes to prod")

## Files involved
- `scripts/seed_sim.py` (new)
- Every service's data access layer (sim guard)

## Tracked from
[[11 - Simulation Mode/Mode Switcher Design]] · [[11 - Simulation Mode/Safe-Mode Guarantees]]
