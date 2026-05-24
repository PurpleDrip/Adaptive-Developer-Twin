---
tags: [yet-to-implement, p2, reliability]
status: pending
priority: P2
estimate: 1 day
---

# Backend — Telemetry — Lift Batch Limit

## Why
Hard-coded `LIMIT 10000` per tick. For 100k+ devs the queue piles up.

## Acceptance criteria
- [ ] `BATCH_LIMIT` env var (default 10000)
- [ ] Documented in [[09 - Operations/Env Vars Master List]]
- [ ] Catch-up mode: when `unprocessed > threshold`, auto-raise to 100k for one tick
- [ ] Metric: `batch_limit_used` (counter or last-value)

## Files involved
- `backend/telemetry/app/services/batch_processor.py`

## Tracked from
[[09 - Operations/Runbook - Batch Processor Drift#Mitigations]]
