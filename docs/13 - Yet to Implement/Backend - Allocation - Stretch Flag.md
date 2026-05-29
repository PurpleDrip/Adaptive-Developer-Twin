---
tags: [yet-to-implement, p2]
status: pending
priority: P2
estimate: 4 hours
---

# Backend — Allocation — Stretch Flag

## Why
Assigning a 0.3-strength dev to a 0.9-required skill is a stretch — PMs want to see this flagged.

## Acceptance criteria
- [ ] Each candidate's response includes `is_stretch: bool` (`task_required - dev_strength > 0.3` for any required skill)
- [ ] UI surfaces a "stretch" badge on the candidate card

## Files involved
- `backend/allocation/app/routers/allocation.py`
- `frontend-nextjs/src/components/pm/CandidateVectorMatch.tsx`

## Tracked from
[[02 - System Architecture/Data Flow - Task Allocation#What's missing]]
