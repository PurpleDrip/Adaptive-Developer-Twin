---
tags: [service, reliability]
---

# Service Health & Ports

> Single source of truth — if `docker-compose.yml` disagrees, **the compose file wins** and the README is wrong.

## Consolidated table

| Service | Host Port | Container Port | Health endpoint | Container hostname |
|:--------|:---------:|:--------------:|:---------------|:-------------------|
| Gateway | 8000 | 8000 | `GET /health` | `gateway-service` |
| Auth | 8001 | 8000 | `GET /api/v1/auth/health` | `auth-service` |
| Telemetry | 8002 | 8000 | `GET /api/v1/telemetry/health` | `telemetry-service` |
| Fusion | 8003 | 8000 | `GET /api/v1/fusion/health` | `fusion-service` |
| THG | 8004 | 8000 | `GET /api/v1/thg/health` | `thg-service` |
| Allocation | 8005 | 8000 | `GET /api/v1/allocation/health` | `allocation-engine` |
| Analytics | 8006 | 8000 | `GET /api/v1/analytics/health` | `analytics-service` |
| Monitoring | 8007 | 8000 | `GET /api/v1/monitoring/health` | `monitoring-service` |
| Task | 8008 | 8000 | `GET /api/v1/task/health` | `task-service` |

## Internal URLs (compose network)

```env
AUTH_URL=http://auth-service:8000
TELEMETRY_URL=http://telemetry-service:8000
FUSION_URL=http://fusion-service:8000
THG_URL=http://thg-service:8000
ALLOCATION_URL=http://allocation-engine:8000
ANALYTICS_URL=http://analytics-service:8000
MONITORING_URL=http://monitoring-service:8000
TASK_URL=http://task-service:8000
```

## Local-dev URLs (no compose)

When running services directly on the host (`./scripts/run_backend.ps1`):

```env
AUTH_URL=http://127.0.0.1:8001
TELEMETRY_URL=http://127.0.0.1:8002
FUSION_URL=http://127.0.0.1:8003
THG_URL=http://127.0.0.1:8004
ALLOCATION_URL=http://127.0.0.1:8005
ANALYTICS_URL=http://127.0.0.1:8006
MONITORING_URL=http://127.0.0.1:8007
TASK_URL=http://127.0.0.1:8008
```

## Readiness (P1 — not yet implemented)

Each service should add `/ready` returning 200 iff:

- Mongo connection pool has ≥1 active conn
- (THG only) Neo4j driver is verified
- (Telemetry, Monitoring) Redis is reachable

Tracked: [[13 - Yet to Implement/Backend - All - Health & Readiness Probes]].
