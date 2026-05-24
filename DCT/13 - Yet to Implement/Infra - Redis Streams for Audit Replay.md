---
tags: [yet-to-implement, p2, observability]
status: pending
priority: P2
estimate: 3 days
---

# Infra — Redis Streams for Audit Replay

## Why
Today: pub/sub (at-most-once). If frontend wants to scroll back 24h of audit, must hit Mongo. Streams give durable replay.

## Acceptance criteria
- [ ] Replace `PUBLISH audit:stream` with `XADD audit:stream`
- [ ] Subscriber uses `XREAD` with consumer group
- [ ] Retention 7 days
- [ ] WS server backfills from streams on reconnect (faster than Mongo for recent data)

## Files involved
- `shared/services/audit_logger.py`
- `backend/monitoring/app/services/ws_manager.py`

## Tracked from
[[02 - System Architecture/Realtime Layer (Redis Pub Sub)#Why pub sub and not streams]]
