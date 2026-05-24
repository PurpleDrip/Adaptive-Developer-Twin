---
tags: [yet-to-implement, p1, performance]
status: pending
priority: P1
estimate: 4 hours
---

# Backend — Allocation — Dev Cache

## Why
Every `/rank` refetches `GET /thg/developers` (all 10k devs). 1s+ p99.

## Acceptance criteria
- [ ] In-process LRU cache, TTL 30s, on `THG.get_all_developers`
- [ ] Or Redis cache shared across allocation pods
- [ ] Tests: 100 sequential `/rank` calls hit THG only once

## Files involved
- `backend/allocation/app/api/clients.py`
- `backend/allocation/app/services/cache.py` (new)

## Tracked from
[[12 - Expert Review/Scalability Loopholes#At 10k devs]]
