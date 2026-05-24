---
tags: [yet-to-implement, p1, security]
status: pending
priority: P1
estimate: 1 week
---

# Backend — Auth — MFA

## Why
Managers and tech_staff hold high-impact privileges. MFA significantly hardens those accounts.

## Acceptance criteria
- [ ] TOTP (RFC 6238) enrollment endpoint
- [ ] QR code generation for authenticator apps
- [ ] Backup codes (10 single-use)
- [ ] `/login` after TOTP enrollment requires the 6-digit code
- [ ] Mandatory for `managers` and `tech_staff` roles; optional for developers
- [ ] Recovery flow via tech admin

## Files involved
- `backend/auth/app/routers/users.py` (enroll + verify endpoints)
- `backend/auth/app/services/mfa.py` (new)
- `frontend-nextjs/src/app/login/page.tsx` (MFA step)

## Tracked from
[[08 - Security & Compliance/Auth & Sessions#MFA future]]
