---
tags: [yet-to-implement, p2, simulation-mode]
status: pending
priority: P2
estimate: 1 hour
---

# Simulation — DTO Fixture Test

## Why
Sim telemetry fixtures must pass the same Pydantic validators as Real Mode. Drift = sim Demo Driver breaks silently.

## Acceptance criteria
- [ ] CI test loads every `scripts/sim/recipes/*.json` ping payload
- [ ] Asserts each parses via `TelemetryIngestDTO`
- [ ] On DTO change → CI flags broken fixtures

## Files involved
- `tests/integration/sim/dto_fixture_test.py` (new)

## Tracked from
[[11 - Simulation Mode/Sim Mode - Telemetry Stream#Telemetry payload validity]]
