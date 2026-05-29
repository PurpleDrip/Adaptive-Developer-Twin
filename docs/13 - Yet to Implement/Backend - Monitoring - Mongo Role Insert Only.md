---
tags: [yet-to-implement, p1, security]
status: pending
priority: P1
estimate: 1 hour
---

# Backend — Monitoring — Mongo Role Insert Only

## Why
Services using `AuditLogger` should only be able to insert + find, never update/delete.

## Acceptance criteria
- [ ] Mongo role `audit-writer` with `insert` + `find` on `audit_logs` only
- [ ] Services use this role's credential (separate from main Mongo user)
- [ ] Tests: attempting `update_one` on `audit_logs` fails with permission error

## Files involved
- IaC (Atlas role config)
- `shared/database/mongo.py`

## Tracked from
[[06 - Data Models/DTO - Audit Log#Why append-only]]
