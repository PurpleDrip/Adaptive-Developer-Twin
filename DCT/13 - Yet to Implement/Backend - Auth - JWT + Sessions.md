---
tags: [yet-to-implement, p0, security]
status: pending
priority: P0
estimate: 5 days
---

# Backend — Auth — JWT + Sessions

## Why
Auth currently returns a user document; the frontend keeps the user in localStorage. No expiry, no revocation, no signature.

## Acceptance criteria
- [ ] `/login` returns `{ access_token, refresh_token, user }`
- [ ] Access token = JWT signed with RS256 (or ES256), 15 min TTL
- [ ] Refresh token = opaque 256-bit random; stored Redis: `refresh:{token} → { user_id, family_id, issued_at }`; 7 day TTL
- [ ] `/logout` endpoint invalidates refresh token (delete from Redis)
- [ ] `/refresh` endpoint rotates both; uses family_id to detect token reuse → revoke whole family
- [ ] JWT public key shipped to every microservice for verification
- [ ] All microservices verify the JWT before honoring `X-User-Role` header
- [ ] Login rate-limited 5/min/IP

## Files involved
- `backend/auth/app/routers/users.py` (login, logout, refresh)
- `shared/auth/jwt.py` (new — issuer + verifier)
- `backend/gateway/app/main.py` (verify on every request)
- `shared/auth/keys/` (key files; loaded via env in prod)
- `frontend-nextjs/src/lib/api/auth.ts` (httpOnly cookie handling)

## Notes
Pair with [[Backend - All - RBAC Signed]]. The full auth refactor.

## Tracked from
[[12 - Expert Review/Top Risks (Ranked)#P0]] · [[08 - Security & Compliance/Auth & Sessions]]
