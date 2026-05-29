---
tags: [observability, reliability]
---

# Docker Compose Stack

> Source: `docker-compose.yml` at repo root. This is the canonical local + small-prod stack.

## Services & ports

See [[03 - Microservices/Service Health & Ports]] for the table.

## Compose file structure

```yaml
version: "3.8"
services:
  telemetry-service:    # :8002 host → :8000 ctnr
  fusion-service:       # :8003 → :8000
  thg-service:          # :8004 → :8000
  allocation-engine:    # :8005 → :8000
  analytics-service:    # :8006 → :8000
  monitoring-service:   # :8007 → :8000
  task-service:         # :8008 → :8000
  gateway-service:      # :8000 → :8000
  auth-service:         # :8001 → :8000
```

Every service gets its env vars from the host `.env`.

## What's missing (current file)

- **No volumes** — DBs are external (Atlas / Aura / Upstash), so containers are stateless. Good. But add `volumes: ./logs:/app/logs` for log persistence in dev.
- **No depends_on** — services start in parallel. Gateway should `depends_on: [auth, telemetry, fusion, ...]` with `condition: service_healthy`.
- **No healthchecks** — add `healthcheck` blocks per service hitting their `/health` endpoint.
- **No restart policy beyond `always`** — `on-failure:5` is friendlier in dev.
- **No network** — explicit `networks:` block makes service hostnames predictable.
- **No resource limits** — `deploy.resources.limits.memory: 512m` per service prevents one runaway from killing the host.

Suggested rewrite tracked: [[13 - Yet to Implement/Infra - Compose File Hardening]].

## Mental shortcut

```bash
# build + up
docker compose up --build

# tail one service
docker compose logs -f fusion-service

# rebuild just one
docker compose up -d --build telemetry-service --no-deps

# stop everything
docker compose down

# wipe volumes (none today)
docker compose down -v
```

## When NOT to use compose

- Multi-host deployment → K8s (see [[02 - System Architecture/Deployment Topology#Target Kubernetes]])
- Auto-scaling → K8s
- High availability for any one service → K8s

Compose is fine up to ~1 host and ~100 concurrent users. Beyond that, migrate.
