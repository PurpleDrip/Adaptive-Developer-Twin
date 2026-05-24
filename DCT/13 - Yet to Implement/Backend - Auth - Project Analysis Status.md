---
tags: [yet-to-implement, p2]
status: pending
priority: P2
estimate: 1 day
---

# Backend — Auth — Project Analysis Status

## Why
Background `analyze-project` calls can fail silently. The user thinks their baseline is computed; it isn't.

## Acceptance criteria
- [ ] `users.project_analysis_status: pending|running|done|failed`
- [ ] Updated atomically as the bg task progresses
- [ ] `GET /users/me/profile` includes the status
- [ ] AnalysisHUD on `/dashboard` shows progress

## Files involved
- `backend/auth/app/routers/users.py`
- `frontend-nextjs/src/components/registration/AnalysisHUD.tsx`

## Tracked from
[[02 - System Architecture/Data Flow - Registration#Failure paths]]
