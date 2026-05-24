---
tags: [yet-to-implement, p1, performance]
status: pending
priority: P1
estimate: 2 days
---

# Backend — Telemetry — Parallel Batch Users

## Why
BatchProcessor processes users serially. At 10k devs × 5-min cadence, each user-batch takes ~0.3s → can keep up. At 100k, single-threaded won't.

## Acceptance criteria
- [ ] `asyncio.gather(*[process_user(u) for u in groups], return_exceptions=True)` with concurrency cap of 32
- [ ] Per-user failures don't fail the whole tick
- [ ] Tests: 1000 user-groups process within 60s

## Files involved
- `backend/telemetry/app/services/batch_processor.py`

## Tracked from
[[12 - Expert Review/Reliability Loopholes#7]] · [[09 - Operations/Runbook - Fusion Engine Stuck#Step 3]]
