---
tags: [yet-to-implement, p0, security]
status: pending
priority: P0
estimate: 2 days
---

# Backend — Auth — Refresh Tokens

## Why
Without refresh, the access token must either be long-lived (insecure) or constantly re-issued via login (bad UX). Standard pattern is short access + long refresh.

## Acceptance criteria
- [ ] Refresh token rotates on every `/refresh` call
- [ ] Token family tracks reuse: if previously-rotated token is presented, **entire family is revoked**
- [ ] Refresh token stored in httpOnly + Secure + SameSite=Strict cookie
- [ ] Refresh has audit entry on rotation
- [ ] Tests: token reuse detection works end-to-end

## Files involved
- Same as [[Backend - Auth - JWT + Sessions]] — implement together.

## Tracked from
[[08 - Security & Compliance/Auth & Sessions#Refresh token]]
