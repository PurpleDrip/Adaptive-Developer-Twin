---
tags: [yet-to-implement, p2, frontend]
status: pending
priority: P2
estimate: 2 days
---

# Frontend — i18n Stub

## Why
V1 is en-US. We don't ship multi-locale yet, but every hardcoded string makes future i18n harder.

## Acceptance criteria
- [ ] All copy in `src/i18n/en-US.json`
- [ ] `t("registration.title")` helper
- [ ] Never concatenate sentences from fragments
- [ ] Lint rule: no string literals in JSX outside `<code>`

## Files involved
- `frontend-nextjs/src/i18n/` (new)
- Many component refactors

## Tracked from
[[10 - UX & UI/Microcopy Guidelines#i18n posture]]
