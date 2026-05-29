---
tags: [yet-to-implement, p2]
status: pending
priority: P2
estimate: 4 hours
---

# Backend — All — Skill Enum Single Source

## Why
Skill names are duplicated in Fusion centroids, Allocation, THG validators, dashboard radar axes.

## Acceptance criteria
- [ ] `shared/constants/skills.py` — single enum + ordering
- [ ] All services import from there
- [ ] Adding a new skill = one-line change

## Files involved
- `shared/constants/skills.py` (new)
- Many imports across `backend/` and `frontend-nextjs/`

## Tracked from
[[12 - Expert Review/Code Quality & Tech Debt#5]] · [[06 - Data Models/DTO - Skill Update#Why not free-form skill names]]
