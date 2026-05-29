---
tags: [yet-to-implement, p2]
status: pending
priority: P2
estimate: 1 week
---

# Backend — Analytics — Stubs to Real

## Why
4 of 5 analytics routers are stubs.

## Acceptance criteria
- [ ] `stats` router: aggregate metrics endpoints (squad velocity, ingest health for analytics)
- [ ] `tests` router: weekly_test analytics
- [ ] `feedback` router: VDA + sentiment
- [ ] `hr_reports` router: cross-squad rollups
- [ ] `leaderboard` router: composite (skill * influence)

## Files involved
- `backend/analytics/app/routers/*.py`

## Tracked from
[[03 - Microservices/Analytics Service#Known gaps]]
