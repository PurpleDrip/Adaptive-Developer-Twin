---
tags: [yet-to-implement, p2]
status: pending
priority: P2
estimate: 1 day
---

# Backend — THG — Per-Skill Decay Rate

## Why
λ=0.1 is one-size-fits-all. Kubernetes flag syntax decays in days; design taste in months.

## Acceptance criteria
- [ ] `skill_decay_rates: {skill: lambda}` in `system_config`
- [ ] Cypher queries reference per-skill λ via parameter
- [ ] Default 0.1 if not configured
- [ ] Tech admin UI to edit per-skill

## Files involved
- `backend/thg/app/routers/thg.py` (Cypher updates)
- `shared/models/system_config.py`

## Tracked from
[[07 - Algorithms/Temporal Decay Model#Why λ 0.1]]
