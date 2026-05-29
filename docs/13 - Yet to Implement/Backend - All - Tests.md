---
tags: [yet-to-implement, p1]
status: pending
priority: P1
estimate: 3 weeks
---

# Backend — All — Tests

## Why
Coverage is 0%. CI is impossible without tests; refactors are scary; regressions inevitable.

## Acceptance criteria
- [ ] `pytest` framework per service
- [ ] Unit coverage ≥ 70% for `auth`, `telemetry`, `fusion`, `thg`
- [ ] Integration coverage of every cross-service hop (via `testcontainers` for Mongo/Neo4j/Redis)
- [ ] Contract tests on shared DTOs (Pact-style schema compatibility)
- [ ] Tests run in CI ([[Infra - CI Pipeline]])

## Files involved
- `backend/*/tests/` (new per service)
- `tests/integration/` at repo root (new)

## Tracked from
[[12 - Expert Review/Code Quality & Tech Debt#11]] · [[01 - Overview/Tier-1 Production Bar#8 Testing]]
