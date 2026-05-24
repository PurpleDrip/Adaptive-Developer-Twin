---
tags: [yet-to-implement, p1, observability]
status: pending
priority: P1
estimate: 3 days
---

# Backend — Monitoring — WS Audit Stream

## Why
The Live Audit HUD has no WS today — it's a designed-but-not-wired feature.

## Acceptance criteria
- [ ] `WS /api/v1/monitoring/ws/audit`
- [ ] Subscribes to Redis `audit:stream`
- [ ] Pushes to all connected clients
- [ ] Heartbeat ping every 30s
- [ ] Backpressure: drop oldest if client buffer > 1000 events
- [ ] Authentication: requires `role in [tech_admin, tech_support]`

## Files involved
- `backend/monitoring/app/routers/monitoring.py`
- `backend/monitoring/app/services/ws_manager.py` (new)
- `frontend-nextjs/src/components/tech/LiveAuditHUD.tsx`

## Tracked from
[[02 - System Architecture/Sequence - Live Audit HUD]]
