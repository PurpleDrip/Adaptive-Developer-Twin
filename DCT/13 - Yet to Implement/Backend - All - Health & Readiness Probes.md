---
tags: [yet-to-implement, p1, reliability]
status: pending
priority: P1
estimate: 1 day
---

# Backend — All — Health & Readiness Probes

## Why
`/health` returns 200 even if Mongo is down. K8s can't restart unhealthy pods.

## Acceptance criteria
- [ ] Every service exposes `/api/v1/{name}/health` (liveness — process alive)
- [ ] Every service exposes `/api/v1/{name}/ready` (readiness — DB / Redis / upstreams reachable)
- [ ] `/ready` checks owner store (Mongo for Auth, Neo4j for THG, Redis for Monitoring)
- [ ] K8s `livenessProbe: /health` and `readinessProbe: /ready`

## Files involved
- Each service's `main.py`
- `shared/health/checks.py` (new — common probe utilities)

## Tracked from
[[03 - Microservices/Service Health & Ports#Readiness P1]]
