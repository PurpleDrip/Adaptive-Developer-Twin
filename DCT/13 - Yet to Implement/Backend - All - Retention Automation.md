---
tags: [yet-to-implement, p2, privacy]
status: pending
priority: P2
estimate: 3 days
---

# Backend — All — Retention Automation

## Why
Retention policy ([[08 - Security & Compliance/Data Retention]]) is documented but not automated.

## Acceptance criteria
- [ ] Per-collection lifecycle script (Mongo TTL + nightly cold tier mover)
- [ ] Monitoring panel: per-collection rows + size + age histogram
- [ ] Alert if any collection exceeds expected size (drift detector)

## Files involved
- `scripts/lifecycle/*.py` (one per collection)
- `backend/monitoring/app/routers/monitoring.py` (size endpoint)

## Tracked from
[[08 - Security & Compliance/Data Retention#Lifecycle automation target]]
