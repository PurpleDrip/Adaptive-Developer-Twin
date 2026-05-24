---
tags: [yet-to-implement, p2, security]
status: pending
priority: P2
estimate: 3 days
---

# Backend — All — BOLA Checks

## Why
`/skills/{dev_id}`, `/tasks/user/{user_id}`, etc. don't check the requester is permitted to view that target.

## Acceptance criteria
- [ ] Helper `assert_can_view(requester, target_user_id)` — allow if:
  - Requester is the target
  - Requester is the target's manager (via MANAGES)
  - Requester is HRM or tech_admin
- [ ] All single-target endpoints call this helper
- [ ] Tests: dev A cannot read dev B's skills

## Files involved
- `shared/auth/permissions.py` (new)
- Every endpoint returning per-user data

## Tracked from
[[08 - Security & Compliance/OWASP Coverage#API1]]
