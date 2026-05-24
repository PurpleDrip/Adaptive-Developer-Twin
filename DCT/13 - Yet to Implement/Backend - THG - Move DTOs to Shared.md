---
tags: [yet-to-implement, p2]
status: pending
priority: P2
estimate: 4 hours
---

# Backend — THG — Move DTOs to Shared

## Why
THG DTOs live in the router file. Consumers (Telemetry, Fusion, Allocation) re-declare them inline.

## Acceptance criteria
- [ ] All THG-edge DTOs (`SkillUpdateDTO`, `ManagerLinkDTO`, `DeveloperCreateDTO`, etc.) live in `shared/models/thg.py`
- [ ] All consumers import from shared
- [ ] No duplication

## Files involved
- `shared/models/thg.py` (new)
- `backend/thg/app/routers/thg.py`
- `backend/telemetry/`, `backend/fusion/`, `backend/allocation/`, `backend/task/`

## Tracked from
[[12 - Expert Review/Code Quality & Tech Debt#3]]
