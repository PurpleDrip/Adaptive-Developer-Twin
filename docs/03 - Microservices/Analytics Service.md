---
tags: [service]
aliases: [Analytics]
---

# Analytics Service

## Identity

| | |
|:---|:---|
| Port | `8006` → `8000` |
| Hostname | `analytics-service` |
| Code | `backend/analytics/` |
| Entry | `backend/analytics/app/main.py` |
| Health | `GET /api/v1/analytics/health` |

## Responsibilities

- **Team-level skill aggregations** (avg strength across a team's devs)
- **Burnout / velocity-decay prediction** (VDA — pillar #8)
- **Composite leaderboards**
- **HR-style reports** for cross-squad analysis
- **Weekly test result analytics**

> Status: **most routers are stubs.** Only `/analytics/team-skills` works today.

## Routes

| Mounted | Path | Handler | Status |
|:--------|:-----|:--------|:-------|
| stats | `prefix /api/v1/analytics/stats` | — | stub |
| tests | `prefix /api/v1/analytics/tests` | — | stub |
| feedback | `prefix /api/v1/analytics/feedback` | — | stub |
| hr_reports | `prefix /api/v1/analytics/hr-reports` | — | stub |
| leaderboard | (no prefix) | — | stub |
| analytics | `prefix /analytics` | `GET /team-skills?team=` | live |

### `/analytics/team-skills`

Queries Neo4j for developers where `primary_domain = team`, computes `avg(r.strength)` per skill across them.

```cypher
MATCH (d:Developer {primary_domain: $team})-[r:HAS_SKILL]->(s:Skill)
RETURN s.name AS skill, avg(r.strength) AS avg_strength, count(d) AS dev_count
```

## Services / Business logic

- `BurnoutPredictor` (`app/services/burnout_predictor.py`) — **stub.** Should consume the last N batches' `total_idle_seconds`, `total_keystrokes`, `total_errors`, regress against a labeled set.
- `SuccessPredictor` (`app/services/success_predictor.py`) — stub
- `Neo4j Service` (`app/services/neo4j.py`) — Neo4j driver + session dep (mirror of THG's; consider extracting to `shared/`)

## Database

Reads Mongo (telemetry_batches, weekly_tests) and Neo4j directly.

## Env vars

| Name | Purpose |
|:-----|:--------|
| `MONGO_URI` | reads |
| `THG_URL` | proxied THG queries |
| `FUSION_URL` | for forward-looking analysis |
| `REDIS_URL` | future cache |
| `NEO4J_URI`/`USER`/`PASSWORD` | direct reads |

## Outbound calls

| To | Endpoint | When |
|:---|:---------|:-----|
| THG | `GET /leaderboard/{skill}` | (planned) composite leaderboard |
| THG | `GET /influence` | (planned) hot-on-influence reports |

## Background tasks

None today.

## Known gaps

- **All routers except `team-skills` are stubs** — entire feature surface to be built
- **Mongo reads aren't indexed for the analytics shape** — see [[06 - Data Models/Index Strategy]]
- **VDA-Oversight not implemented** — Pillar #8 is currently aspirational. Critical to ship for "predicting burnout" claim.
- **Two Neo4j drivers** (here and in THG) — should consolidate to a single `shared/database/neo4j.py`. ([[13 - Yet to Implement/Backend - All - Shared Neo4j Driver]])

Tracked:
- [[13 - Yet to Implement/Backend - Analytics - Implement VDA]]
- [[13 - Yet to Implement/Backend - Analytics - Stubs to Real]]


---

## Testing

**Test location:** `backend/analytics/test/`

### Algorithm tests (`pytest -m algorithm`)
- `test/unit/test_burnout_predictor.py` — insufficient data (< 7 days), output range [0,1], status boundary conditions (healthy/at_risk/critical), trend key
- `test/unit/test_success_predictor.py` — high match -> high probability, low match -> low probability, heuristic method when untrained

### Integration tests (`pytest -m integration`)
- `test/integration/test_routes.py` — team-skills, leaderboard, stats, feedback, hr-reports, weekly test submission

### Known edge cases surfaced during testing
- **`BurnoutPredictor` GRU model is untrained at runtime** (no `.pth` loaded) — all predictions use random weights, making burnout scores meaningless until a trained model is loaded
- **`SuccessPredictor` XGBoost model is similarly untrained** — heuristic mode used with confidence=0.6; `_is_trained` flag is never set to True by any code path
- Both predictors need model loading wired up before production use
