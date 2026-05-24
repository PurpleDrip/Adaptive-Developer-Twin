---
tags: []
---

# Code Quality & Tech Debt

## 1. Stubs everywhere

Fusion has 6+ service files that are empty:

- `anomaly_detector.py`
- `normalizer.py`
- `weight_engine.py`
- `bayesian_fusion.py`
- `online_learner.py`
- `project_analyzer.py`

The fusion endpoint composes these. Best case: NameError. Likely: silently mock-mode behavior.

**Fix**: Implement or remove from compose path. **Highest single tech-debt item.**

## 2. Doubled route prefix

```python
router = APIRouter(prefix="/fusion")
app.include_router(router, prefix="/api/v1/fusion")
# Resulting path: /api/v1/fusion/fusion/run
```

**Fix**: Drop the inner `/fusion`.

## 3. DTO copies

`shared/models/user.py` AND `shared/dto/user.py` both exist with overlapping classes. Drift inevitable.

**Fix**: Single source of truth. Remove `shared/dto/`.

## 4. Duplicated Neo4j drivers

`backend/thg/app/services/neo4j.py` and `backend/analytics/app/services/neo4j.py` are near-clones.

**Fix**: Move to `shared/database/neo4j.py`.

## 5. Magic strings everywhere

Skill names (`"backend"`, `"frontend"`, etc.) hard-coded in:

- Fusion centroids
- Anomaly thresholds
- Dashboard radar axes
- THG validation
- Allocation scoring

**Fix**: One `shared/constants/skills.py` enum.

## 6. Hardcoded ports / URLs

Default fallbacks like `http://127.0.0.1:8005` for FUSION_URL in auth code. Diverges from compose hostnames.

**Fix**: No defaults; fail-fast on missing env.

## 7. Mixed sync/async patterns

Some service methods are `def`, called from `async def` handlers without `run_in_executor`. Blocks the event loop.

**Fix**: Audit; either make truly async (`motor` for Mongo, `httpx` async, `neo4j` async driver) or use `asyncio.to_thread`.

## 8. Pydantic v1-style validators

`@validator` is v1. We're on Pydantic v2 (with the model rebuild patterns). Should use `@field_validator`.

**Fix**: Audit + upgrade.

## 9. `print()` left in code

Several `print(...)` statements survive. Look unprofessional and don't route to log aggregators.

**Fix**: Replace with `log.info(...)`. Lint rule to forbid `print` in `backend/`.

## 10. Missing requirements pinning

`requirements.txt` files don't pin versions strictly. Reproducible builds need exact pins.

**Fix**: `pip-compile` to lockfile (`requirements.in` → `requirements.txt`).

## 11. No tests

No `tests/` directory in any service. Coverage = 0%.

**Fix**: Start with the auth login flow + telemetry ingest + fusion run path. Aim for 70% before any prod deploy.

## 12. Inconsistent error responses

Some endpoints return `{"detail": "..."}`; others `{"error": "..."}`; others raw strings.

**Fix**: Custom exception handler that produces the standard FastAPI shape everywhere.

## 13. Legacy frontend

`frontend/` (Vite) is dead. Just clutter at this point.

**Fix**: Confirm + delete.

## 14. ScriptS without `--help` or docstrings

Most `scripts/*.py` are undocumented. The seeder is destructive — needs `--help` with safety rails.

**Fix**: argparse + module docstrings.

## 15. PowerShell scripts only

`run_backend.ps1`, `setup_backend.ps1` are PowerShell-only. macOS / Linux devs are second-class.

**Fix**: Cross-platform via `Makefile` or `task` (taskfile.dev).

---

Each → [[13 - Yet to Implement/_MOC]].
