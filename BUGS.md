# Bugs & Design Concerns Surfaced During Testing

**Date:** 2026-05-29
**Test run:** `pytest backend/` — 97 tests, 0 failures, 77 deprecation warnings

This document captures real issues found in production code during the test-writing pass. Tests themselves all pass; these are findings worth fixing before production.

---

## High Priority

### 1. ML models load but are never trained — predictions are random

**Files:**
- `backend/analytics/app/services/burnout_predictor.py`
- `backend/analytics/app/services/success_predictor.py`

**Issue:** `BurnoutPredictor` instantiates a fresh `nn.GRU` with random weights every time. `load_state_dict(...)` line is commented out. Same for `SuccessPredictor` — `xgb.Booster()` is created but `load_model(...)` is commented out and `_is_trained = False` is never flipped.

**Impact:** Every burnout risk score and task-success probability returned to managers is meaningless. The "heuristic" fallback in `SuccessPredictor` is sane; the `BurnoutPredictor` GRU is pure noise.

**Fix:** Train and persist the models, then uncomment the load lines.

---

### 2. Gateway trusts `X-Forwarded-For` unconditionally

**File:** `backend/gateway/app/main.py` (`IPWhitelistMiddleware.dispatch`)

**Issue:** When `X-Forwarded-For` is present, the gateway uses the first value as the client IP without verifying the request came from a known reverse proxy.

**Impact:** Any external client can set `X-Forwarded-For: 10.0.0.5` and bypass the office-network IP whitelist on `/api/v1/telemetry/telemetry/ingest`.

**Fix:** Only trust `X-Forwarded-For` when the immediate `request.client.host` is itself a known proxy IP.

---

### 3. Bcrypt 72-byte password truncation is silent

**File:** `backend/auth/app/routers/users.py` (`register_user`)

**Issue:** `raw_password = dto.password[:72]` truncates without warning. Two users with passwords `"<71-char-prefix>X..."` and `"<71-char-prefix>Y..."` end up with the same hash.

**Impact:** Theoretical password collision; users with extra-long passwords don't get the security they think they do.

**Fix:** Either reject passwords > 72 bytes at the DTO layer with a 422, or hash to a fixed length first (SHA-256 → bcrypt is a common pattern).

---

## Medium Priority

### 4. Hard-coded 0.2 match threshold in `WorkloadOptimizer`

**File:** `backend/allocation/app/services/workload_optimizer.py`

**Issue:** `if match_scores[r, c] > 0.2` — any task-developer pair below 0.2 is silently dropped even if it's the best available match.

**Impact:** When all candidates are weak matches (e.g. a niche skill nobody has yet), the system returns zero assignments and the task sits unallocated.

**Fix:** Configurable threshold, or fall back to the highest-scoring assignment when all are below threshold.

---

### 5. `WeightEngine` silently under-weights unknown evidence sources

**File:** `backend/fusion/app/services/weight_engine.py`

**Issue:** `weights.get(source, 0.10)` — any source not in `DEFAULT_WEIGHTS` gets weight 0.10. Adding a new evidence type without updating `DEFAULT_WEIGHTS` makes it contribute much less than the developer intended.

**Fix:** Log a warning when an unknown source is encountered. Better: explicit registration.

---

### 6. `BatchProcessor` uses non-tz-aware `datetime.utcnow()`

**File:** `backend/telemetry/app/services/batch_processor.py` (deprecation warning surfaced in tests)

**Issue:** `datetime.utcnow()` is deprecated in Python 3.12+; tz-naive datetimes cause subtle bugs when serialized/compared with tz-aware ones from MongoDB.

**Fix:** Replace with `datetime.now(datetime.UTC)` throughout.

---

### 7. FastAPI `on_event` is deprecated across all services

**Files:** Every service's `app/main.py`

**Issue:** All services use the deprecated `@app.on_event("startup")` / `@app.on_event("shutdown")` pattern. FastAPI recommends the `lifespan` context manager.

**Fix:** Migrate to `lifespan` handlers — single PR across all 9 services.

---

## Low Priority / Design Observations

### 8. THG `update-skill` schema does not enforce `0 ≤ strength ≤ 1`

**File:** `backend/thg/app/schemas/thg.py`

**Issue:** `SkillUpdateRequest.strength` accepts any float. A buggy caller could write strength = 1.5 to the graph.

**Fix:** Add `Field(..., ge=0.0, le=1.0)` to the schema.

---

### 9. THG `match-task` returns empty list (not 404) for unknown task_id

**File:** `backend/thg/app/routers/thg.py`

**Issue:** Querying with a nonexistent `task_id` returns `[]` rather than 404. Consumers can't tell "task doesn't exist" from "task exists but no matches".

**Fix:** Return 404 when the task node is absent.

---

### 10. `Monitoring PUT /system-config` does not validate positive intervals

**File:** `backend/monitoring/app/routers/monitoring.py`

**Issue:** Setting `batch_interval_minutes: 0` is accepted; the scheduler would spin at maximum frequency.

**Fix:** `Field(..., gt=0)` on the request schema.

---

### 11. `BurnoutPredictor` cold-start: fewer than 10 records → fits Isolation Forest on the same batch it's predicting

**File:** `backend/fusion/app/services/anomaly_detector.py`

**Issue:** `analyze_batch` calls `fit_predict` on the batch itself when not pre-trained. The model is then biased by the data it's evaluating.

**Fix:** Ship a pre-trained model or refuse to evaluate until enough baseline data has accumulated.

---

## Test Coverage Notes

- **97 tests, 0 failures** across all 9 backend services
- All algorithm-level tests pass — confirms the math (cosine similarity, Hungarian, Bayesian posterior, weighted scoring) is correct
- Integration tests use mocked DBs; no live MongoDB/Neo4j/Redis required
- Live-integration test layer (against real `.env` credentials) is wired but not exercised in this report

## Recommended Next Steps

1. Fix high-priority bugs (#1, #2, #3) before any production deployment
2. Address `datetime.utcnow()` and `on_event` migrations together — one PR per service
3. Add request schema bounds (#8, #10) — quick wins
4. Plan the ML model training pipeline (#1) — likely a separate epic
