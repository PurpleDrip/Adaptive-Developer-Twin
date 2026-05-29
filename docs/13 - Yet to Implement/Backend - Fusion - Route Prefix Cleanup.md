---
tags: [yet-to-implement, p2]
status: pending
priority: P2
estimate: 30 min
---

# Backend — Fusion — Route Prefix Cleanup

## Why
Routes are `/api/v1/fusion/fusion/...` (doubled). Cosmetic but confusing.

## Acceptance criteria
- [ ] Remove inner `prefix="/fusion"` from the router
- [ ] Update Postman collection
- [ ] Add deprecated-route shim that 301-redirects old paths for 30 days

## Files involved
- `backend/fusion/app/routers/fusion.py`
- `postman/`

## Tracked from
[[03 - Microservices/Fusion Service#Routes]] · [[12 - Expert Review/Code Quality & Tech Debt#2]]
