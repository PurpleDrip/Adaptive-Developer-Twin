---
tags: [yet-to-implement, p1]
status: pending
priority: P1
estimate: 1 day
---

# Backend — Task — BGSC Config

## Why
Bounds (max_per_batch_delta, max_per_day_delta, review_threshold) are hardcoded. Per-org tuning needed.

## Acceptance criteria
- [ ] `system_config.bgsc.{max_per_batch_delta, max_per_day_delta, min_confidence_floor, review_threshold}`
- [ ] Telemetry batch processor + Task assessment respect these
- [ ] Tech admin UI to edit
- [ ] Audit on change

## Files involved
- `shared/models/system_config.py`
- `backend/telemetry/app/services/batch_processor.py`
- `backend/task/app/services/assessment.py`

## Tracked from
[[07 - Algorithms/BGSC Feedback#Configurable bounds]]
