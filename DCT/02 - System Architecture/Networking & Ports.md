---
tags: [architecture, reliability]
---

# Networking & Ports

## Port table (host ↔ container)

| Host | Container | Service | URL (local) |
|:----:|:---------:|:--------|:------------|
| 8000 | 8000 | Gateway | `http://localhost:8000` |
| 8001 | 8000 | Auth | `http://localhost:8001` |
| 8002 | 8000 | Telemetry | `http://localhost:8002` |
| 8003 | 8000 | Fusion | `http://localhost:8003` |
| 8004 | 8000 | THG | `http://localhost:8004` |
| 8005 | 8000 | Allocation | `http://localhost:8005` |
| 8006 | 8000 | Analytics | `http://localhost:8006` |
| 8007 | 8000 | Monitoring | `http://localhost:8007` |
| 8008 | 8000 | Task | `http://localhost:8008` |
| 3000 | 3000 | Next.js dev | `http://localhost:3000` |
| 5173 | 5173 | Legacy Vite | `http://localhost:5173` |

> ⚠️ **Note**: README claims Telemetry=8002 / Task=8003 etc. Compose file disagrees. Source of truth is [[09 - Operations/Docker Compose Stack]]. The README is **wrong** in places — see [[13 - Yet to Implement/Documentation - README Ports]].

## DNS conventions (compose network)

Inside the docker-compose network, services resolve each other by service name:

```
http://auth-service:8000
http://telemetry-service:8000
http://fusion-service:8000
http://thg-service:8000
http://allocation-engine:8000
http://analytics-service:8000
http://monitoring-service:8000
http://task-service:8000
http://gateway-service:8000
```

This is what `*_URL` env vars resolve to in production. In local dev (running services on the host), they resolve to `http://127.0.0.1:<host port>`.

## CORS

Configured **only at the gateway**. Microservices accept `*` (mistake — see [[12 - Expert Review/Security Loopholes#CORS too permissive]]).

Production CORS allowlist (env `CORS_ORIGINS`, comma-separated):

```
https://app.adt.example.com,https://demo.adt.example.com
```

## Health endpoints

Every service exposes:

- `GET /api/v1/{service}/health` — liveness

Should also expose (P1):

- `GET /api/v1/{service}/ready` — readiness (DB/Redis connected)
- `GET /metrics` — Prometheus exposition

See [[13 - Yet to Implement/Backend - All - Health & Readiness Probes]].

## TLS

Currently HTTP-only in dev/compose. Production must terminate TLS at:

1. The CDN / load balancer (Cloudflare, AWS ALB, etc.)
2. Optionally re-encrypted to the gateway via mTLS

End-to-end TLS to each microservice is **not** required if the cluster network is private — but liveness probes should still use the in-cluster scheme.
