---
tags: [yet-to-implement, p1, frontend, security]
status: pending
priority: P1
estimate: 2 days
---

# Frontend — Auth Context Hardening

## Why
User identity is read from `localStorage`. Trivially edited. The frontend trusts this for role-gated routes.

## Acceptance criteria
- [ ] After [[Backend - Auth - JWT + Sessions]] ships, frontend stores access token in memory only
- [ ] Refresh token in httpOnly cookie (the server handles it)
- [ ] `AuthContext` provides `user`, `role`, `isAuthenticated`, `refresh()`
- [ ] On 401, automatic refresh + retry; on refresh-fail, logout
- [ ] No PII (email, role) in localStorage

## Files involved
- `frontend-nextjs/src/lib/auth/context.tsx` (new)
- `frontend-nextjs/src/lib/api/index.ts` (interceptors)

## Tracked from
[[05 - Frontends/State & API Client#Local storage usage today]]
