---
tags: [yet-to-implement, p1]
status: pending
priority: P1
estimate: 1 day
---

# Backend — Allocation — Hungarian Implementation

## Why
`WorkloadOptimizer.optimize_assignments` is a stub. `/optimize` returns 500 today.

## Acceptance criteria
- [ ] `scipy.optimize.linear_sum_assignment` on the match matrix
- [ ] Greedy fallback for matrices > 500×500 (with documented degradation)
- [ ] Tests: small matrix has known optimal assignment

## Files involved
- `backend/allocation/app/services/workload_optimizer.py`

## Tracked from
[[03 - Microservices/Allocation Service#Known gaps]]
