---
tags: [yet-to-implement, p1, compliance]
status: pending
priority: P1
estimate: 2 days
---

# Backend — Monitoring — Audit Retention Policy

## Why
`audit_logs` grows unbounded. Need hot+cold tier.

## Acceptance criteria
- [ ] Nightly job: export entries > 90 days to object storage (object-locked bucket for compliance)
- [ ] Delete from hot
- [ ] Cold retained 7 years
- [ ] Restore tool for compliance lookups

## Files involved
- `scripts/lifecycle/audit_archive.py` (new)

## Tracked from
[[08 - Security & Compliance/Audit Logging#Retention]]
