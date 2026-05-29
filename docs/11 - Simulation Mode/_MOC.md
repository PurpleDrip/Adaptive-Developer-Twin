---
tags: [moc, simulation-mode]
status: implemented
---

# 11 — Simulation Mode · Map of Content

> The **investor / judge / customer demo** mode. Embedded IDE → live telemetry pipeline → Fusion → THG → dashboards — all on **one screen**, scripted, beautiful, and reproducible.

## Implementation status

**Phase 1 — self-contained frontend demo: ✅ DONE** (2026-05-28)

The simulation mode lives at **`/sim`** in the Next.js app and is fully self-contained — no backend required. It runs entirely in the browser with simulated pipeline state, making it bomb-proof for investor demos.

| Component | Status | File |
|:----------|:-------|:-----|
| `/sim` route | ✅ Done | `src/app/sim/page.tsx` |
| Demo Driver (step engine) | ✅ Done | `src/components/sim/SimDemo.tsx` |
| Embedded IDE panel | ✅ Done | `src/components/sim/IDEPanel.tsx` |
| Pipeline visualization | ✅ Done | `src/components/sim/PipelinePanel.tsx` |
| Dashboard reflection | ✅ Done | `src/components/sim/DashboardPanel.tsx` |
| Type definitions | ✅ Done | `src/lib/sim/types.ts` |
| Demo script (7 steps) | ✅ Done | `src/lib/sim/demoScript.ts` |
| Landing page CTA | ✅ Done | `src/app/page.tsx` |
| Old Vite `frontend/` removed | ✅ Done | deleted |

**Phase 2 — backend-connected real sim: ⏳ Not started**

See [[13 - Yet to Implement/Simulation - Mode Switch + Seed Data]] and [[13 - Yet to Implement/Simulation - Safe Mode Tests]] for what remains.

---

## Read first

- [[Why Simulation Mode]] — the strategy
- [[Mode Switcher Design]] — Real ↔ Sim toggle, safety
- [[Safe-Mode Guarantees]] — what Sim Mode promises NEVER to do

## Designing the experience

- [[Sim Mode - Architecture]] — updated to reflect Phase 1 implementation
- [[Sim Mode - Screen Choreography]]
- [[Sim Mode - Embedded IDE Panel]] — updated: custom tokenizer, not Monaco
- [[Sim Mode - Telemetry Stream]] — updated: self-contained in Phase 1
- [[Sim Mode - Fusion Live View]]
- [[Sim Mode - THG Live Update]]
- [[Sim Mode - Dashboard Reflection]]
- [[Sim Mode - Investor Script]] — updated: actual 7-step script
- [[Demo Data Recipes]]
- [[Latency Faking & Heartbeats]]

## Contrast

- [[Real Mode - Contrast]]
