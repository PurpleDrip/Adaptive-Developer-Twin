---
tags: [yet-to-implement, p1, reliability]
status: pending
priority: P1
estimate: 3 days
---

# Backend — Telemetry — DLQ

## Why
A poison batch (e.g., snippet that crashes CodeBERT) keeps retrying forever, stalling the queue.

## Acceptance criteria
- [ ] After 3 retries on a batch, move it to `telemetry_batches_dlq` with full error trace
- [ ] DLQ batches don't block subsequent batches
- [ ] Alert when DLQ count > 0 for 5 minutes
- [ ] Tech admin UI shows DLQ contents
- [ ] Admin can replay or discard each DLQ entry

## Files involved
- `backend/telemetry/app/services/batch_processor.py`
- `backend/telemetry/app/routers/admin.py` (new — DLQ endpoints)
- `frontend-nextjs/src/app/tech/dlq/page.tsx` (new)

## Tracked from
[[12 - Expert Review/Reliability Loopholes#5]]
