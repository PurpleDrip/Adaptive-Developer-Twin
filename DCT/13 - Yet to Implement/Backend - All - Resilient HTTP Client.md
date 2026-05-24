---
tags: [yet-to-implement, p1, reliability]
status: pending
priority: P1
estimate: 3 days
---

# Backend — All — Resilient HTTP Client

## Why
Plain `httpx` calls fail on transient blips. No retries, no circuit breakers, no per-call timeouts.

## Acceptance criteria
- [ ] `shared/http/resilient_client.py` wraps `httpx.AsyncClient` with:
  - `tenacity` retry (3 attempts, exp backoff 100ms→1s, only for 5xx + network errors)
  - `pybreaker` circuit breaker per target service (trip on 5 consecutive fails, cooldown 30s)
  - Per-call timeout (caller specifies; sensible default)
  - Trace ID propagation (carries `X-Request-ID`)
- [ ] Replace all bare `httpx.AsyncClient` calls in cross-service paths
- [ ] Tests: simulated 503s recover; persistent 503s trip breaker

## Files involved
- `shared/http/resilient_client.py` (new)
- Every service's `app/api/clients.py` or equivalent

## Tracked from
[[12 - Expert Review/Reliability Loopholes#1]] · [[12 - Expert Review/Reliability Loopholes#2]]
