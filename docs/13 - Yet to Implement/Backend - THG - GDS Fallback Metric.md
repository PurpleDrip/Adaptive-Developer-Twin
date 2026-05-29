---
tags: [yet-to-implement, p2, observability]
status: pending
priority: P2
estimate: 2 hours
---

# Backend — THG — GDS Fallback Metric

## Why
When `/influence` falls back to native Cypher (GDS unavailable), no log or metric. We won't know prod is missing GDS.

## Acceptance criteria
- [ ] Counter: `thg_gds_fallback_used_total`
- [ ] Log at WARN every fallback
- [ ] Alert if rate > 0 for 5 min

## Files involved
- `backend/thg/app/routers/thg.py`

## Tracked from
[[07 - Algorithms/Native Cypher Fallback#Observability]]
