---
tags: [yet-to-implement, p1, security]
status: pending
priority: P1
estimate: 2 days
---

# Backend — Auth — Username Cross-Collection Uniqueness

## Why
Mongo can't enforce uniqueness across `users`/`managers`/`tech_staff`. A username collision causes the polymorphic lookup to be ambiguous (first match wins).

## Acceptance criteria
- [ ] `username_index` collection with `{username, collection}` and unique on `username`
- [ ] Every account-creation flow writes to `username_index` in the same transaction
- [ ] Same for `email_index`
- [ ] Tests: creating a developer with username `alice` then a manager with same username → second fails

## Files involved
- `backend/auth/app/routers/users.py`, `routers/admin.py`
- `backend/auth/app/services/directory.py` (new)

## Tracked from
[[08 - Security & Compliance/Identity Isolation#Cross-collection invariants]]
