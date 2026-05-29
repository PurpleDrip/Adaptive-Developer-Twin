---
tags: [yet-to-implement, p2]
status: pending
priority: P2
estimate: 1 week
---

# Backend — Fusion — Drift Detection

## Why
A dev's skill profile suddenly diverges from their history → potential code copying / ghostwriting. Hard to detect from single-batch anomalies.

## Acceptance criteria
- [ ] Per-dev rolling baseline of skill distribution (last 50 batches)
- [ ] Each new batch compared against baseline; large Wasserstein distance → flag
- [ ] Drift flag → manager review (not a fraud_flag — just a "review me" signal)

## Files involved
- `backend/fusion/app/services/drift_detector.py` (new)
- `backend/fusion/app/routers/fusion.py` (call from /run)

## Tracked from
[[07 - Algorithms/Anomaly Detection#The arms race]]
