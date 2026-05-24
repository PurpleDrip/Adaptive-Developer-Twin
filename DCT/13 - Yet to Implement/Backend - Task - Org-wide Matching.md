---
tags: [yet-to-implement, p2]
status: pending
priority: P2
estimate: 4 hours
---

# Backend — Task — Org-wide Matching

## Why
HRMs need to find candidates org-wide. `/match` is squad-scoped today.

## Acceptance criteria
- [ ] `POST /api/v1/task/match-org-wide` (role=hrm)
- [ ] Same as `/match` but no squad filter
- [ ] Audit entry per call

## Files involved
- `backend/task/app/routers/tasks.py`

## Tracked from
[[02 - System Architecture/Data Flow - Task Allocation#Why squad-scoping]]
