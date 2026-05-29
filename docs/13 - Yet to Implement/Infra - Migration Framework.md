---
tags: [yet-to-implement, p2, reliability]
status: pending
priority: P2
estimate: 3 days
---

# Infra — Migration Framework

## Why
Schema migrations today are ad-hoc. Tier-1 needs reversible, tested migrations.

## Acceptance criteria
- [ ] Migration tool (per store): mongo-migrate / liquibase-mongo + cypher-migrations
- [ ] Each migration is `up` + `down` Python/Cypher
- [ ] CI test: every migration runs up→down→up cleanly
- [ ] Two-phase pattern enforced (expand → deploy → contract)

## Files involved
- `migrations/mongo/`, `migrations/neo4j/`
- `scripts/migrate.py` (new)

## Tracked from
[[09 - Operations/Deployment Strategies#Database migrations]]
