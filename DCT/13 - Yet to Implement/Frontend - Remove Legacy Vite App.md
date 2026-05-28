---
tags: [yet-to-implement, p2, frontend]
status: done
priority: P2
estimate: 1 hour
completed: 2026-05-28
---

# Frontend — Remove Legacy Vite App

## Why
`frontend/` is a dead Vite app. Clutter.

## Acceptance criteria
- [ ] Confirm no live route references it
- [ ] Confirm no docker-compose reference
- [ ] `git rm -r frontend/`
- [ ] Update `README.md` and [[05 - Frontends/_MOC]]

## Files involved
- `frontend/` (delete)
- `README.md`

## Tracked from
[[05 - Frontends/Legacy Vite Frontend#Sunset plan]]
