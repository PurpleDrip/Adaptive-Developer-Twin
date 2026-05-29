---
tags: [yet-to-implement, p1, frontend]
status: pending
priority: P1
estimate: 1 day
---

# Frontend — Error Boundaries

## Why
Uncaught render errors blank the whole page tab.

## Acceptance criteria
- [ ] `<ErrorBoundary>` at every top-level route (`app/dashboard/layout.tsx`, etc.)
- [ ] Reports to a `/api/v1/monitoring/client-error` endpoint (planned)
- [ ] User sees a friendly "Something went wrong" with a "Reload" CTA
- [ ] Don't swallow — propagate to Sentry / equivalent

## Files involved
- `frontend-nextjs/src/components/ui/ErrorBoundary.tsx` (new)
- Every `app/.../layout.tsx`

## Tracked from
[[05 - Frontends/Next.js App#Known gaps]]
