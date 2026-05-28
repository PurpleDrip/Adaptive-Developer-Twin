---
tags: [moc, yet-to-implement, done]
---

# Done

> Completed punch-list items, archived here when their status flips to `done`.

---

## Frontend — Remove Legacy Vite App ✅

**Completed:** 2026-05-28

`frontend/` (Vite + React app) deleted. No live routes referenced it. No docker-compose reference existed. The Next.js app in `frontend-nextjs/` is the sole frontend.

Original: [[Frontend - Remove Legacy Vite App]]

---

## Simulation Mode — Phase 1 (self-contained frontend demo) ✅

**Completed:** 2026-05-28

Route `/sim` live in `frontend-nextjs`. Fully self-contained — no backend required. 7-step scripted demo with typing animation, pipeline particle system, Fusion fraud scenario, and dashboard radar morphs.

Files delivered:
- `src/app/sim/page.tsx`
- `src/components/sim/SimDemo.tsx` (Demo Driver + orchestration)
- `src/components/sim/IDEPanel.tsx` (custom VS Code lookalike)
- `src/components/sim/PipelinePanel.tsx` (SVG pipeline + particles)
- `src/components/sim/DashboardPanel.tsx` (radar + ticker)
- `src/lib/sim/types.ts`
- `src/lib/sim/demoScript.ts` (7-step recipe + personas)
- Landing page `/` — "Watch the Live Demo" gradient CTA added

Original tickets:
- [[Simulation - Embedded IDE Panel]]
- [[Simulation - Demo Driver Engine]]
- [[Simulation - Recipe Runner UI]]
- [[Simulation - Scripted Demo Driver]]

Phase 2 (backend-connected sim) remains open: [[Simulation - Mode Switch + Seed Data]].
