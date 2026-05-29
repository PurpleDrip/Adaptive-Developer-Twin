---
tags: [yet-to-implement, p0, security]
status: pending
priority: P0
estimate: 1 hour
---

# Backend — THG — Demo Endpoint Gate

## Why
`POST /api/v1/thg/generate-demo-data` is unauthenticated and **destroys** the Neo4j graph.

## Acceptance criteria
- [ ] Endpoint requires `role=tech_admin` (via [[Backend - All - RBAC Signed]])
- [ ] Endpoint refuses if `ENVIRONMENT=prod` (env var)
- [ ] Audit entry on every call
- [ ] Test: unauthenticated POST returns 401/403

## Files involved
- `backend/thg/app/routers/thg.py` (add deps)

## Tracked from
[[12 - Expert Review/Security Loopholes#3]]
