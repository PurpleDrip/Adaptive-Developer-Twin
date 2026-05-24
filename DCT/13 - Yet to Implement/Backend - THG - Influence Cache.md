---
tags: [yet-to-implement, p2, performance]
status: pending
priority: P2
estimate: 4 hours
---

# Backend — THG — Influence Cache

## Why
`/influence` runs PageRank every call. Influence doesn't move fast — cache 5 min.

## Acceptance criteria
- [ ] Redis cache `thg:influence:result` with TTL 5 min
- [ ] On cache miss, compute + populate
- [ ] Manual invalidation endpoint (tech_admin)
- [ ] Metric: cache hit ratio

## Files involved
- `backend/thg/app/routers/thg.py`

## Tracked from
[[07 - Algorithms/EVC-Influence (PageRank)#Performance]]
