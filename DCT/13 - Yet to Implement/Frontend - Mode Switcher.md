---
tags: [yet-to-implement, p1, frontend, simulation-mode]
status: pending
priority: P1
estimate: 2 days
---

# Frontend — Mode Switcher

## Why
Tech admins need a deliberate Real ↔ Sim switcher with safety rails.

## Acceptance criteria
- [ ] Top-right pill per [[11 - Simulation Mode/Mode Switcher Design]]
- [ ] Full-screen confirmation with 5-second hold
- [ ] Chrome color changes per mode (uses [[10 - UX & UI/Color System#Sim Mode accent]])
- [ ] Server audit on switch
- [ ] Banner across the whole app while in `sim`

## Files involved
- `frontend-nextjs/src/components/SimModeSwitcher.tsx` (new)
- `frontend-nextjs/src/components/SimBanner.tsx` (new)
- `frontend-nextjs/src/app/layout.tsx` (mount)

## Tracked from
[[11 - Simulation Mode/Mode Switcher Design]]
