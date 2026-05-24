---
tags: [yet-to-implement, p1, simulation-mode, frontend]
status: pending
priority: P1
estimate: 1 week
---

# Simulation — Embedded IDE Panel

## Why
The "Monaco editor in the browser" is the heart of the visual demo.

## Acceptance criteria
- [ ] Monaco mounted in `EmbeddedIDE` component
- [ ] Dark theme matching sim chrome
- [ ] Programmatic typing with WPM + jitter per [[11 - Simulation Mode/Sim Mode - Embedded IDE Panel]]
- [ ] File switching mid-demo
- [ ] Cursor visible, blinking
- [ ] "Live ping ●" indicator on each ping send

## Files involved
- `frontend-nextjs/src/components/sim/EmbeddedIDE.tsx` (new)
- `frontend-nextjs/package.json` (monaco-editor)

## Tracked from
[[11 - Simulation Mode/Sim Mode - Embedded IDE Panel]]
