---
tags: [yet-to-implement, p2, security]
status: pending
priority: P2
estimate: 4 hours
---

# Backend — Auth — Unlock Endpoint

## Why
Hardware unlock today requires Data Explorer Mongo write. Should be a dedicated, audited endpoint.

## Acceptance criteria
- [ ] `POST /api/v1/auth/admin/extension/{ext_id}/unlock` (role=tech_admin)
- [ ] Clears `whitelist.{ext_id}.machine_id = null`
- [ ] Audit: `action=extension_unlocked, by=<admin>, reason=<text>`
- [ ] Optional: notification to developer

## Files involved
- `backend/auth/app/routers/admin.py`

## Tracked from
[[07 - Algorithms/SHA-HWID Anchor#Migration re-lock procedure]]
