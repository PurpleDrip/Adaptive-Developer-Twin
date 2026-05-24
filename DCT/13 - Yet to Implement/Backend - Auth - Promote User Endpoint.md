---
tags: [yet-to-implement, p2]
status: pending
priority: P2
estimate: 3 days
---

# Backend — Auth — Promote User Endpoint

## Why
Real orgs promote devs to managers. Today only Data Explorer mutations can do it (poorly).

## Acceptance criteria
- [ ] `POST /api/v1/auth/admin/promote-user {user_id, new_role}` (role=tech_admin)
- [ ] Reads from source collection, writes to target, deletes source (Mongo transaction)
- [ ] Updates THG: `MATCH (d:Developer {id}) SET d:Manager REMOVE d:Developer`
- [ ] Audit: `action=user_promoted, by=<admin>, from=<role>, to=<role>`
- [ ] Tests: developer becomes manager; their THG node has both old + new labels temporarily during the op

## Files involved
- `backend/auth/app/routers/admin.py`
- `backend/auth/app/services/promote.py` (new)

## Tracked from
[[08 - Security & Compliance/Identity Isolation#Migration role-changes]]
