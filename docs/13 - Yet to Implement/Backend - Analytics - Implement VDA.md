---
tags: [yet-to-implement, p1]
status: pending
priority: P1
estimate: 2 weeks
---

# Backend — Analytics — Implement VDA

## Why
Pillar #8 (burnout / velocity decay) is aspirational. Stub today.

## Acceptance criteria
- [ ] Daily feature extraction job (per [[07 - Algorithms/VDA-Oversight#Inputs]])
- [ ] Linear regression model trained on initial labeled set (synthetic + handful real)
- [ ] `GET /api/v1/analytics/vda/{user_id}` returns `BurnoutResult` shape
- [ ] Dashboard surface for the user (self-view first, then managers with consent)
- [ ] Tests: regression on a known toy dataset

## Files involved
- `backend/analytics/app/services/burnout_predictor.py`
- `backend/analytics/app/routers/feedback.py` (mount VDA endpoint here or in stats)
- `scripts/train_vda.py` (new)

## Tracked from
[[07 - Algorithms/VDA-Oversight]]
