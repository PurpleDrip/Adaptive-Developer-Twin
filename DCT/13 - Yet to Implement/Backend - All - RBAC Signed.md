---
tags: [yet-to-implement, p0, security]
status: pending
priority: P0
estimate: 5 days
---

# Backend — All — RBAC Signed

## Why
Today the `X-User-Role` header is set by the client. Any user can claim `tech_admin`. This is the single most impactful security flaw in the system.

## Acceptance criteria
- [ ] Gateway verifies access JWT on every request
- [ ] Gateway extracts `user_id` + `role` from the verified JWT
- [ ] Gateway sets `X-User-Id` and `X-User-Role` headers on the forwarded request **after stripping any incoming values with those names**
- [ ] Gateway also signs a service-to-service token (HMAC w/ shared key OR mTLS)
- [ ] Each microservice rejects requests where the trust header isn't present/signed
- [ ] `shared/auth/rbac.role_required` reads from the trusted header only
- [ ] Tests: a request with client-supplied `X-User-Role: tech` to a backend service directly is rejected
- [ ] Tests: a request through the gateway with a developer JWT can't access `/admin/*`

## Files involved
- `backend/gateway/app/main.py` (new auth middleware)
- `shared/auth/rbac.py` (require signed source)
- Every service's `main.py` (add the signed-header dependency)
- `shared/auth/jwt.py` (new — issue/verify)

## Notes
Blocks [[Backend - Auth - JWT + Sessions]] (the JWT itself must exist first). Sequence those.

## Tracked from
[[12 - Expert Review/Top Risks (Ranked)]] · [[12 - Expert Review/Security Loopholes#1]]
