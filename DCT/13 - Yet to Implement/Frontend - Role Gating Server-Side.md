---
tags: [yet-to-implement, p1, frontend, security]
status: pending
priority: P1
estimate: 2 days
---

# Frontend — Role Gating Server-Side

## Why
Role checks happen `useEffect` after hydration. Brief flicker shows protected content. Also: client-only checks are bypassable.

## Acceptance criteria
- [ ] `middleware.ts` reads the JWT cookie, verifies, extracts role
- [ ] Routes under `/tech/*` require `tech_admin` / `tech_support`
- [ ] Routes under `/project-manager/*` require manager roles
- [ ] Routes under `/dashboard/*` require any authenticated
- [ ] Redirects to login on missing/invalid

## Files involved
- `frontend-nextjs/src/middleware.ts` (refactor)
- `frontend-nextjs/src/lib/auth/server.ts` (new)

## Tracked from
[[05 - Frontends/Next.js App#Known gaps]]
