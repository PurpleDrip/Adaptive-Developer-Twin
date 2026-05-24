---
tags: [yet-to-implement, p1, security]
status: pending
priority: P1
estimate: 1 day
---

# Backend — Gateway — JWT Verification Edge

## Why
Gateway forwards requests without verifying auth. Defense-in-depth requires gateway to verify before reaching any service.

## Acceptance criteria
- [ ] Gateway middleware verifies access JWT on every protected path
- [ ] Public paths (`/health`, `/login`, `/register`) explicitly allowlisted
- [ ] On valid JWT: extract `user_id`/`role`, strip any client-supplied trust headers, set gateway-signed `X-User-Id`/`X-User-Role`
- [ ] On invalid/expired: 401 with WWW-Authenticate

## Files involved
- `backend/gateway/app/middleware/jwt.py` (new)
- `backend/gateway/app/main.py`

## Tracked from
[[03 - Microservices/Gateway Service#Known gaps]] · [[Backend - All - RBAC Signed]]
