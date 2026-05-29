---
tags: [yet-to-implement, p1]
status: pending
priority: P1
estimate: 4 days
---

# Backend — All — DTO Versioning

## Why
A breaking DTO change cascades silently across services.

## Acceptance criteria
- [ ] Each shared DTO carries a `schema_version` field
- [ ] Producers stamp their version; consumers reject mismatched majors
- [ ] CI runs schema-diff between PR branch and `main`; flags breaking changes
- [ ] Doc per DTO with version history

## Files involved
- `shared/models/*.py`
- `shared/schema/diff.py` (new — CI helper)

## Tracked from
[[06 - Data Models/Cross-Service DTO Contracts#Versioning policy target]]
