---
tags: [yet-to-implement, p1, security]
status: pending
priority: P1
estimate: 3 days
---

# Backend — Monitoring — Audit Hash Chain

## Why
A mutated audit log defeats every other defense. Hash chain detects tampering.

## Acceptance criteria
- [ ] Each entry has `prev_hash` (sha256 of previous entry's `entry_hash`)
- [ ] Each entry has `entry_hash` (sha256 of canonicalized content + prev_hash)
- [ ] Verification job walks the chain daily
- [ ] On break, alert + freeze writes; investigate manually

## Files involved
- `shared/services/audit_logger.py`
- `backend/monitoring/app/services/chain_verifier.py` (new)

## Tracked from
[[08 - Security & Compliance/Audit Logging#Tamper detection]]
