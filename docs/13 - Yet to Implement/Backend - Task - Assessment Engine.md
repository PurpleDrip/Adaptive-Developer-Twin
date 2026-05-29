---
tags: [yet-to-implement, p1]
status: pending
priority: P1
estimate: 2 weeks
---

# Backend — Task — Assessment Engine

## Why
Single-attempt assessments are the BGSC feedback signal. Today the router is empty.

## Acceptance criteria
- [ ] Endpoints per [[06 - Data Models/DTO - Assessment]] (`/generate`, `/submit`, `/result`)
- [ ] Single-attempt cryptographic enforcement: server stores a one-time token; `/submit` invalidates it
- [ ] BGSC delta computed from score and pushed via THG `/update-skill`
- [ ] Manager review surface
- [ ] Tests: cannot retake; correct score → correct delta

## Files involved
- `backend/task/app/routers/assessment.py`
- `backend/task/app/services/assessment.py` (new)
- `frontend-nextjs/src/components/dev/AssessmentRunner.tsx`

## Tracked from
[[06 - Data Models/DTO - Assessment]] · [[03 - Microservices/Task Service#Known gaps]]
