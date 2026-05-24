---
tags: [yet-to-implement, p2]
status: pending
priority: P2
estimate: 2 days
---

# Backend — Telemetry — Sliding Mode

## Why
"SWEF" is named "Sliding Window" but currently does **tumbling**. Optional sliding mode would give smoother trends.

## Acceptance criteria
- [ ] Config flag: `BATCH_MODE=tumbling|sliding`
- [ ] In sliding mode: windows overlap by 50%
- [ ] Aggregations weighted by recency in overlap regions
- [ ] Tests: sliding produces ~2× the batch count of tumbling for same record stream

## Files involved
- `backend/telemetry/app/services/batch_processor.py`

## Tracked from
[[07 - Algorithms/SWEF-Ingestion (Sliding Window)#The window contract]]
