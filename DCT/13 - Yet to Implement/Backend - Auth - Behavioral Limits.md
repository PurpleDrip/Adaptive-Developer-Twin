---
tags: [yet-to-implement, p2, security]
status: pending
priority: P2
estimate: 2 days
---

# Backend — Auth — Behavioral Limits

## Why
Rate-limit by request count isn't enough. "Register 1000 accounts in 1 hour" is a business-flow attack.

## Acceptance criteria
- [ ] Per-IP register limit: 5/hour
- [ ] Per-IP failed-login limit: 10/hour (then captcha)
- [ ] Per-tenant register limit (when multi-tenant): 100/day default
- [ ] Suspicious patterns logged to `audit_logs` as `action=behavioral_limit_hit`

## Files involved
- `backend/auth/app/middleware/behavioral.py` (new)

## Tracked from
[[08 - Security & Compliance/OWASP Coverage#API6]]
