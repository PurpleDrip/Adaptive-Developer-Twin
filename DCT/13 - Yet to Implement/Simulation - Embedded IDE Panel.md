---
tags: [yet-to-implement, p1, simulation-mode, frontend]
status: done
priority: P1
estimate: 1 week
completed: 2026-05-28
---

# Simulation — Embedded IDE Panel

## Why
The "Monaco editor in the browser" is the heart of the visual demo.

## Acceptance criteria
- [x] IDE panel mounted in `IDEPanel.tsx` (custom VS Code lookalike, not Monaco)
- [x] Dark theme matching sim chrome (`#0d0f14`, `#1e2030`, `#1a1d2e`)
- [x] Programmatic typing with WPM + jitter per [[11 - Simulation Mode/Sim Mode - Embedded IDE Panel]]
- [x] File switching mid-demo (SimDemo sets `fileName` + `displayedCode` at step boundaries)
- [x] Cursor visible, blinking (CSS keyframe `blink`)
- [x] "Live ping ●" indicator on each ping send (`pingFlash` prop)

## Decision: no Monaco
Monaco was replaced with a custom `<div>` + tokenizer. See [[11 - Simulation Mode/Sim Mode - Embedded IDE Panel#Why NOT Monaco]].

## Files involved
- `frontend-nextjs/src/components/sim/IDEPanel.tsx` ✅

## Tracked from
[[11 - Simulation Mode/Sim Mode - Embedded IDE Panel]]
