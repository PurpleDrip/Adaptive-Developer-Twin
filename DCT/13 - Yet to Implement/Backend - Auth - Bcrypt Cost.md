---
tags: [yet-to-implement, p1, security]
status: pending
priority: P1
estimate: 2 hours
---

# Backend — Auth — Bcrypt Cost

## Why
`CryptContext(schemes=["bcrypt"])` uses passlib defaults. Need cost ≥ 12 for production.

## Acceptance criteria
- [ ] `CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)`
- [ ] Existing hashes flagged as `deprecated`; auto-rehash on next successful login
- [ ] Tests: hashing with new context produces 12-round hash; old 10-round still verifies

## Files involved
- `backend/auth/app/services/crypto.py` (or wherever CryptContext is instantiated)

## Tracked from
[[12 - Expert Review/Security Loopholes#7]]
