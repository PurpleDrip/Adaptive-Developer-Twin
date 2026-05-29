---
tags: [yet-to-implement, p1, observability]
status: pending
priority: P1
estimate: 2 hours
---

# Backend — Monitoring — Audit System Config

## Why
`PUT /system-config` mutates config without auditing. Ironic — the audit-of-the-auditor.

## Acceptance criteria
- [ ] Every config change writes `audit_logs` entry `action=system_config_changed, by, before, after`
- [ ] Test: PUT triggers audit row

## Files involved
- `backend/monitoring/app/routers/monitoring.py`

## Tracked from
[[12 - Expert Review/Top Risks (Ranked)#17]]
