---
tags: [yet-to-implement, p1, reliability]
status: pending
priority: P1
estimate: 1 day
---

# Backend — Telemetry — Idempotency Key

## Why
Extension retries (network hiccup) double-write the same raw record. Batch aggregation then double-counts.

## Acceptance criteria
- [ ] `/ingest` accepts `Idempotency-Key` header (UUID per ping)
- [ ] Redis SETNX with TTL 10 min — duplicate key → return previous response
- [ ] Extension generates and sends key per ping
- [ ] Tests: send same ping twice with same key → only one row in `telemetry_raw`

## Files involved
- `backend/telemetry/app/routers/telemetry.py`
- `extension/src/telemetry/sender.ts`

## Tracked from
[[12 - Expert Review/Reliability Loopholes#12]] · [[12 - Expert Review/Data Integrity Gaps#1]]
