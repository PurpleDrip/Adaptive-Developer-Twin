---
tags: [yet-to-implement, p0, security]
status: pending
priority: P0
estimate: 3 days
---

# Backend — Auth — Data Explorer Hardening

## Why
Today the Data Explorer:
- Returns `password_hash` in user docs
- Lets a tech admin write any field in any document
- Has no field-level allowlist
- Has no audit on writes

This is a backdoor.

## Acceptance criteria
- [ ] Field allowlist per collection (e.g., `users` allows reading `user_id, name, email, role, is_active`; never `password_hash`)
- [ ] Per-collection **write allowlist** (e.g., `users.role`: NO; `whitelist.machine_id`: YES via `/admin/unlock-extension` only)
- [ ] Every write to Data Explorer emits `action=data_explorer_write` with `before/after`
- [ ] UI warns: "You are editing prod data. All actions are logged. Continue?" with 5-sec hold-to-confirm
- [ ] Long-term: replace generic CRUD with **domain-specific admin endpoints** (`/admin/unlock-extension`, `/admin/promote-user`, etc.)
- [ ] Killswitch: feature flag `data_explorer_enabled` (off by default in prod)

## Files involved
- `backend/auth/app/routers/admin.py` (refactor)
- `shared/services/audit_logger.py` (new action)
- `frontend-nextjs/src/components/tech/DataExplorer.tsx` (UI warnings + confirm)

## Tracked from
[[12 - Expert Review/Security Loopholes#4]] · [[12 - Expert Review/Design Anti-Patterns#3]]
