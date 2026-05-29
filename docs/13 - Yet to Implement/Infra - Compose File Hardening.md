---
tags: [yet-to-implement, p2]
status: pending
priority: P2
estimate: 1 day
---

# Infra — Compose File Hardening

## Why
Local stack lacks healthchecks, depends_on conditions, resource limits.

## Acceptance criteria
- [ ] `healthcheck:` per service hitting their `/health`
- [ ] `depends_on: condition: service_healthy` for gateway
- [ ] `deploy.resources.limits.memory` per service
- [ ] Explicit `networks:` block
- [ ] `restart: on-failure:5` (not `always` for dev)

## Files involved
- `docker-compose.yml`

## Tracked from
[[09 - Operations/Docker Compose Stack#What's missing current file]]
