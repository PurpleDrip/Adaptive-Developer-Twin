---
tags: [yet-to-implement, p2]
status: pending
priority: P2
estimate: 2 hours
---

# Scripts — Seeder Hard Stops

## Why
`scripts/seed_production_demo.py` is destructive (`drop`). Running against prod = data loss.

## Acceptance criteria
- [ ] Refuse if `MONGO_DB_NAME` contains `prod`
- [ ] Refuse if `NEO4J_URI` host contains `prod`
- [ ] `--force` flag to override (with prompt)
- [ ] Log every drop/insert at INFO
- [ ] `--dry-run` previews what would happen

## Files involved
- `scripts/seed_production_demo.py`

## Tracked from
[[09 - Operations/Seeding Production Demo#Safety rails]]
