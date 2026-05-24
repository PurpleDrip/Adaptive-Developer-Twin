---
tags: [yet-to-implement, p2, frontend, a11y]
status: pending
priority: P2
estimate: 2 days
---

# Frontend — Accessibility CI

## Why
A11y regressions silently accumulate without automated checks.

## Acceptance criteria
- [ ] `@axe-core/react` integrated in dev mode (warnings during render)
- [ ] CI job `pa11y-ci` runs against staged pages (login, dashboard, PM, tech)
- [ ] Block PR merge on a11y errors

## Files involved
- `frontend-nextjs/package.json`
- CI config

## Tracked from
[[10 - UX & UI/Accessibility (a11y)#Audit cadence]]
