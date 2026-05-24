---
tags: [yet-to-implement, p2]
status: pending
priority: P2
estimate: 2 hours
---

# Backend — Fusion — Model Version Field

## Why
`engine_version: "v2.0-top-tier"` is hardcoded. Need a per-batch tracked version so we can compare results across model upgrades.

## Acceptance criteria
- [ ] `ENGINE_VERSION` constant in code
- [ ] Set in every fusion response
- [ ] Stored in `telemetry_batches.fusion_result.engine_version`
- [ ] Stored in `audit_logs` for every skill_update

## Files involved
- `backend/fusion/app/__init__.py` (or wherever)

## Tracked from
[[03 - Microservices/Fusion Service#Known gaps]]
