---
tags: [yet-to-implement, p2]
status: pending
priority: P2
estimate: 1 day
---

# Backend — THG — Revert Endpoint

## Why
A bad batch can move a score. Need to roll back via the audit history.

## Acceptance criteria
- [ ] `POST /api/v1/thg/admin/revert {audit_entry_ids: [...]}` (tech_admin)
- [ ] For each entry: compute compensating delta and apply
- [ ] Final audit `action=skill_reverted, source_audit_ids=[...]`

## Files involved
- `backend/thg/app/routers/thg.py`

## Tracked from
[[07 - Algorithms/BGSC Feedback#Reversibility]]
