---
tags: [yet-to-implement, p1, security]
status: pending
priority: P1
estimate: 2 hours
---

# Backend — Gateway — Body Size Limits

## Why
No request body cap. Large workspace snapshots (or malicious payloads) can DoS via memory.

## Acceptance criteria
- [ ] Default cap: 1 MB
- [ ] Per-endpoint overrides (e.g., `/telemetry/ingest`: 100 KB; `/telemetry/snapshot-url`: 1 KB)
- [ ] 413 Payload Too Large on overflow
- [ ] Tests: 2 MB body to `/ingest` → 413

## Files involved
- `backend/gateway/app/middleware/body_limit.py` (new)
- NGINX `client_max_body_size` if behind ingress

## Tracked from
[[03 - Microservices/Gateway Service#Known gaps]]
