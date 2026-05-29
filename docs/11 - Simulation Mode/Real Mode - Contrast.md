---
tags: [simulation-mode, real-mode]
---

# Real Mode — Contrast

> When customers see the product, what's different from the demo?

## Side-by-side

| Aspect | Sim Mode | Real Mode |
|:-------|:---------|:----------|
| **Heartbeat** | 1 s | 30 s (configurable) |
| **Batch interval** | 10 s | 5 min |
| **Telemetry source** | Monaco IDE in browser | Actual VS Code extension |
| **Pipeline visualization** | Always visible | Only in Tech Admin `/system-health` (no particles) |
| **Hardware lock** | Pre-seeded | Real `vscode.env.machineId` lock |
| **Personas** | sim-alice, sim-bob, … | Real org employees |
| **Demo Driver** | Scripted recipes | Real devs typing |
| **Dashboard updates** | Tied to choreography beats | Live, on real WS push when THG writes |
| **Mode chrome** | Indigo/pink gradient | Neutral |
| **Banner** | "SIM MODE · data synthetic" | None |
| **Audit log env** | `env: "sim"` | `env: "prod"` |

## What the customer learns from the demo

After seeing Sim Mode, the customer understands:

1. **The pipeline is real** — code → telemetry → batch → fusion → THG → dashboard
2. **The math is principled** — reliability score, Bayesian blend, decay, BGSC
3. **The safety is in layers** — hardware lock, identity isolation, server-side fusion
4. **The UI is engineered** — dense, calm, evidence-first

What they DON'T learn from sim:

- Real ingest latency at scale
- Real fusion accuracy on their codebase
- Real privacy posture against their compliance team

For those, run a **paid pilot** (see sales playbook).

## Honest disclosure to the customer

Sim is **not** "what it would look like with your data." It's "what the pipeline does — sped up and animated."

Tell them this. Customers buy trust, and the fastest way to lose it is to overpromise based on a sped-up demo.

## Sim → Real bridge

When a customer signs up:

1. They get a real tenant
2. The Demo Driver does NOT touch their tenant
3. Day 1 of their real install: same UI, but Real Mode. No pipeline animations. Cadence at 30 s / 5 min.
4. After 7 days: they have enough real batches to see their Radar HUD move with real signal.

This week-1 silence is the **honest mode**. Document it in onboarding: "Telemetry needs ~5 batches of evidence to start moving your Twin meaningfully. Hold tight — Day 7 is when it gets fun."
