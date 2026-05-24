---
tags: [yet-to-implement, p2]
status: pending
priority: P2
estimate: 4 days
---

# Backend — Fusion — Anomaly Detector

## Why
Sub-task of [[Backend - Fusion - Real ML Pipeline]]. Implements per-batch reliability scoring.

## Acceptance criteria
- [ ] `AnomalyDetector.analyze_batch(signals)` returns float reliability_score [0,1]
- [ ] All 6 sub-checks per [[07 - Algorithms/Anomaly Detection]]
- [ ] Geometric mean composition
- [ ] Per-batch breakdown returned to caller
- [ ] Unit tests with synthetic human + bot inputs

## Files involved
- `backend/fusion/app/services/anomaly_detector.py`
- `backend/fusion/tests/test_anomaly.py`

## Tracked from
[[07 - Algorithms/Anomaly Detection]]
