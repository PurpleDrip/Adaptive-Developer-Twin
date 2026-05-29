---
tags: [yet-to-implement, p2]
status: pending
priority: P2
estimate: 1 hour
---

# Documentation — README Ports

## Why
`README.md` and `docker-compose.yml` disagree on port assignments (Telemetry=8002 vs 8002? Task=8003 vs 8008?). Confuses new contributors.

## Acceptance criteria
- [ ] Audit and reconcile against [[03 - Microservices/Service Health & Ports]]
- [ ] Update README port table
- [ ] Add a "source of truth: compose file" note

## Files involved
- `README.md`

## Tracked from
[[02 - System Architecture/Networking & Ports#Port table host container]]
