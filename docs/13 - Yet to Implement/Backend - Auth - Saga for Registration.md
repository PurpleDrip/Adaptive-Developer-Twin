---
tags: [yet-to-implement, p1, reliability]
status: pending
priority: P1
estimate: 3 days
---

# Backend — Auth — Saga for Registration

## Why
Registration writes to Mongo (`users`, `whitelist`), then calls THG `/create-dev`. If THG fails, Mongo state is orphaned (no Developer node for the new user).

## Acceptance criteria
- [ ] Saga state stored in Mongo: `registration_sagas { user_id, step, retries, status }`
- [ ] Step 1: Mongo writes (transactional within Mongo)
- [ ] Step 2: THG `/create-dev` with retry (exponential backoff, max 5)
- [ ] On permanent THG failure: mark `users.is_ghost=true`, alert
- [ ] Periodic reconciler scans for ghosts and retries
- [ ] Tests: simulate THG down → user is ghost; bring THG up → reconciler fixes it

## Files involved
- `backend/auth/app/services/saga.py` (new)
- `backend/auth/app/routers/users.py` (refactor register)

## Tracked from
[[02 - System Architecture/Data Flow - Registration#Failure paths]]
