---
tags: [yet-to-implement, p2]
status: pending
priority: P2
estimate: 4 hours
---

# Backend — Allocation — Exclusion List

## Why
Manager can't veto a candidate without modifying the squad.

## Acceptance criteria
- [ ] `TaskAllocationRequest.exclude_dev_ids: list[str]`
- [ ] Allocation filters those out before ranking
- [ ] UI lets PM toggle "Exclude" on a candidate card

## Files involved
- `backend/allocation/app/routers/allocation.py`
- `frontend-nextjs/src/components/pm/CandidateVectorMatch.tsx`

## Tracked from
[[02 - System Architecture/Data Flow - Task Allocation#What's missing]]
