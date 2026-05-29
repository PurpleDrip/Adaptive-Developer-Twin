---
tags: [yet-to-implement, p1]
status: pending
priority: P1
estimate: 1 week
---

# Backend — Fusion — Reliability Calibration

## Why
The thresholds & weights in [[07 - Algorithms/Reliability Score Model]] are priors. Need to calibrate against labeled data.

## Acceptance criteria
- [ ] Labeled dataset: 10k known-human batches + 10k synthetic-bot batches
- [ ] Tune weights to maximize ROC-AUC at threshold 0.5
- [ ] Per-org calibration when label data exists
- [ ] Document chosen weights with rationale

## Files involved
- `backend/fusion/app/services/anomaly_detector.py`
- `scripts/calibrate_anomaly.py` (new)
- `telemetry_training_set.csv` (extend)

## Tracked from
[[07 - Algorithms/Reliability Score Model#Calibration]]
