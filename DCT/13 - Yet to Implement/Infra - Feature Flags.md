---
tags: [yet-to-implement, p2]
status: pending
priority: P2
estimate: 2 days
---

# Infra — Feature Flags

## Why
We need kill switches and gradual rollouts (e.g., Data Explorer per env, new Fusion versions per tenant).

## Acceptance criteria
- [ ] Pick provider: LaunchDarkly / Flagsmith / Unleash / OpenFeature
- [ ] Per-flag: targeting by tenant, role, env
- [ ] Backend SDK + frontend SDK
- [ ] Audit every flag mutation

## Files involved
- `shared/flags/client.py` (new)
- `frontend-nextjs/src/lib/flags/` (new)

## Tracked from
[[09 - Operations/Deployment Strategies#Feature flags]]
