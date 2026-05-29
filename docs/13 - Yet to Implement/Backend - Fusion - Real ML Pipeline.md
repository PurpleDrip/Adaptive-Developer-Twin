---
tags: [yet-to-implement, p0]
status: pending
priority: P0
estimate: 2 weeks
---

# Backend — Fusion — Real ML Pipeline

## Why
Six core service files are empty stubs:
- `anomaly_detector.py`
- `normalizer.py`
- `weight_engine.py`
- `bayesian_fusion.py`
- `online_learner.py`
- `project_analyzer.py`

The fusion `/run` endpoint composes these. Without them, the system's "tamper-proof AI" claim isn't backed by code.

## Acceptance criteria
- [ ] `AnomalyDetector` — see [[Backend - Fusion - Anomaly Detector]] for full spec
- [ ] `Normalizer.extract_telemetry_signals(batch)` → `{wpm, keystrokes, ..., reliability_inputs}`
- [ ] `WeightEngine.fuse_all_skills(telemetry_signals, semantic_signals, project_baseline)` → per-skill dict
- [ ] `BayesianFuser.calculate_posterior_confidence(prior, evidence)` per [[07 - Algorithms/Bayesian Skill Fusion]]
- [ ] `ProjectAnalyzer.analyze_github_repo(repo_url, user_id)` per [[07 - Algorithms/SCM-Audit AST]]
- [ ] `OnlineLearner` — defer to P2 unless the team wants ongoing centroid refinement
- [ ] Unit tests with synthetic batches; expected reliability_score ranges
- [ ] Integration test: a "human" batch → high reliability; a "bot" batch → fraud_flag

## Files involved
- `backend/fusion/app/services/anomaly_detector.py`
- `backend/fusion/app/services/normalizer.py`
- `backend/fusion/app/services/weight_engine.py`
- `backend/fusion/app/services/bayesian_fusion.py`
- `backend/fusion/app/services/project_analyzer.py`
- `backend/fusion/app/services/online_learner.py`
- `backend/fusion/tests/` (new)

## Notes
Single biggest gap. Allocate two engineers for two weeks ideally.

## Tracked from
[[12 - Expert Review/Code Quality & Tech Debt#1]] · [[03 - Microservices/Fusion Service#Known gaps]]
