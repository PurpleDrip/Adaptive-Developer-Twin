---
tags: [yet-to-implement, p2, security]
status: pending
priority: P2
estimate: 2 hours
---

# Backend — All — Tighten CORS

## Why
Individual microservices have `allow_origins=["*"]`. CORS should be enforced only at the gateway.

## Acceptance criteria
- [ ] Microservices: CORS disabled (or origins=`[]`) — they trust the gateway
- [ ] Gateway: env-driven allowlist per environment (no `*`)
- [ ] Tests: a request to a microservice directly with a browser-origin header is rejected

## Files involved
- Every microservice's `main.py`
- `backend/gateway/app/main.py`

## Tracked from
[[12 - Expert Review/Security Loopholes#2]] · [[02 - System Architecture/Networking & Ports#CORS]]
