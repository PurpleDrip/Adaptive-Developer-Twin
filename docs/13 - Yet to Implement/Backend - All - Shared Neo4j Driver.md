---
tags: [yet-to-implement, p2]
status: pending
priority: P2
estimate: 4 hours
---

# Backend — All — Shared Neo4j Driver

## Why
`backend/thg/app/services/neo4j.py` and `backend/analytics/app/services/neo4j.py` are near-clones.

## Acceptance criteria
- [ ] `shared/database/neo4j.py` exposes `init_neo4j`, `close_neo4j`, `get_session` dependency
- [ ] Both THG and Analytics import from shared
- [ ] No duplicated code

## Files involved
- `shared/database/neo4j.py` (new)
- `backend/thg/app/services/neo4j.py` (deprecate)
- `backend/analytics/app/services/neo4j.py` (deprecate)

## Tracked from
[[12 - Expert Review/Code Quality & Tech Debt#4]]
