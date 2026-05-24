---
tags: [yet-to-implement, p1, reliability]
status: pending
priority: P1
estimate: 2 days
---

# Backend — Telemetry — Leader Election

## Why
Multiple telemetry pods both think they're THE batch processor → double-counting.

## Acceptance criteria
- [ ] Redis SET-NX with TTL lock acquired before each tick
- [ ] Lock auto-extends during work
- [ ] Lock released on tick completion
- [ ] Pod that doesn't hold the lock acts as standby
- [ ] Tests: spin 3 pods; only one tick runs at a time

## Files involved
- `backend/telemetry/app/services/batch_processor.py`
- `shared/locks/redis_lease.py` (new)

## Tracked from
[[12 - Expert Review/Reliability Loopholes#4]]
