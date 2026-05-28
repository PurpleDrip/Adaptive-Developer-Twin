# Comprehensive Testing Design — ADT-v1

**Date:** 2026-05-29
**Status:** Approved
**Scope:** Backend services (9), VS Code extension, Postman collection, Docs & README

---

## 1. Goals

- Surface all bugs and loopholes across every service before they reach production
- Verify algorithmic correctness for Fusion, Allocation, and Analytics engines
- Provide a Postman collection that tests every exposed and internal endpoint
- Give the VS Code extension full unit → integration → e2e coverage
- Run fast offline (unit) and thorough with infrastructure (integration) via a single pytest invocation

---

## 2. Backend Test Structure

### Layout (replicated per service)

```
backend/<service>/
└── test/
    ├── conftest.py              # shared fixtures: mock DB, Redis, HTTP clients
    ├── unit/
    │   ├── test_models.py       # Pydantic validation, field constraints, enums
    │   ├── test_services.py     # business logic with all external calls mocked
    │   └── test_algorithms.py  # algo-heavy services only (Fusion, Allocation, Analytics)
    └── integration/
        ├── test_routes.py       # FastAPI TestClient, real DB
        └── test_db.py           # direct Mongo/Neo4j layer tests
```

### Root configuration

```
pytest.ini      # rootdir, asyncio_mode=auto, marker registry
conftest.py     # env loading, DB teardown hooks shared across all services
```

### Pytest markers

| Marker | Meaning |
|---|---|
| `unit` | No external dependencies, runs anywhere |
| `integration` | Requires live `.env` credentials + running DBs |
| `algorithm` | Algorithm correctness, may be slow |
| `slow` | Any test exceeding ~2s |

Run commands:
```bash
pytest -m unit                  # offline suite
pytest -m integration           # live infrastructure
pytest -m "unit or algorithm"   # combined
pytest                          # everything
```

### Framework stack

- `pytest` + `pytest-asyncio` — async test support
- `httpx.AsyncClient` — async FastAPI TestClient
- `pytest-mock` — mocking
- `mongomock` — in-memory MongoDB for unit layer
- `fakeredis` — in-memory Redis for unit layer
- Real Motor + Neo4j driver for integration layer

### Algorithm-specific coverage

| Service | Algorithms under test |
|---|---|
| Fusion | `CodeBERTAnalyzer` semantic similarity, `AnomalyDetector` keystroke jitter classification, `WeightEngine` score computation |
| Allocation | `SkillMatcher.calculate_match()`, `WorkloadOptimizer` multi-factor scoring (60/20/20 split) |
| Analytics | `BurnoutPredictor` output ranges, `SuccessPredictor` edge cases, prediction stability |
| THG | Neo4j Cypher query correctness for skill matching, graph traversal, edge creation |

---

## 3. Postman Collection

### File structure

```
postman/
├── ADT-Complete-Test-Suite.postman_collection.json
├── environments/
│   ├── ADT-Direct-Services.postman_environment.json   # per-service ports
│   └── ADT-Gateway.postman_environment.json           # all via :8000
└── README.md
```

### Environment variables

**Direct Services:**
```
AUTH_URL=http://localhost:8001
TELEMETRY_URL=http://localhost:8002
FUSION_URL=http://localhost:8003
THG_URL=http://localhost:8004
ALLOCATION_URL=http://localhost:8005
ANALYTICS_URL=http://localhost:8006
MONITORING_URL=http://localhost:8007
TASK_URL=http://localhost:8008
```

**Gateway:**
```
BASE_URL=http://localhost:8000/api/v1
```

### Collection folders (~50+ requests)

| Folder | Count | Highlights |
|---|---|---|
| Auth Service | 23 | login, register, hardware-lock, validate-extension, admin CRUD, notifications, device connect |
| Telemetry Service | 3 | handshake, ingest batch, status check |
| Fusion Service | 2 | fusion trigger, anomaly-flagged payload |
| THG Service | 7 | all graph CRUD + match-task |
| Allocation Engine | 3 | rank with strong match, weak match, no match |
| Analytics Service | 8+ | team-skills, leaderboard, burnout, HR reports, feedback, tests |
| Monitoring Service | 6 | config GET/PUT, audit log, health check, holidays, metrics |
| Task Service | 4 | match preview, create task, assessment routes |
| Gateway | 4 | CORS preflight, IP block, proxy routing, health |

### Per-request standards

Every request includes:
- **Pre-request script** — chains tokens/IDs from prior responses via collection variables
- **Tests tab** — status code, response schema, field presence, business-rule assertions
- **Negative sub-folder** — missing fields, wrong role, invalid/expired token, malformed payload

---

## 4. VS Code Extension Tests

### Layout

```
extension/
└── test/
    ├── unit/
    │   ├── collector.test.ts    # WPM calc, keystroke capture, idle detection
    │   ├── buffer.test.ts       # 30s batching, compression, overflow
    │   ├── sender.test.ts       # retry (3x), backoff, 401 stop
    │   ├── snapshotter.test.ts  # zip creation, .env/.git exclusion
    │   └── scanner.test.ts      # secret redaction: sk-*, AKIA*, .env values
    ├── integration/
    │   └── pipeline.test.ts     # collector → buffer → sender → real telemetry
    ├── e2e/
    │   └── extension.test.ts    # headless VS Code: activate, type, assert batch sent
    └── fixtures/
        ├── mock-vscode.ts       # VS Code API stubs
        └── sample-events.ts     # synthetic keystroke/document events
```

### Framework stack

- **Unit/Integration:** Mocha + Chai + Sinon
- **E2E:** `@vscode/test-electron` (official headless VS Code runner)

### Key scenarios

| Module | Critical test |
|---|---|
| scanner | `sk-proj-abc123` → `[REDACTED]` before payload send |
| buffer | Never sends partial batch; flushes on extension deactivate |
| sender | Retries 3× on 503, stops immediately on 401 |
| e2e | Type 50 chars, wait 35s, assert telemetry endpoint received valid JSON batch |

---

## 5. Docs & README Updates

### README.md additions

- **Testing section** with all run commands (see above)
- **Project structure** diagram updated for `docs/`, `frontend/` renames
- **Docker section** updated with frontend service
- **Scripts section** updated to reflect removed demo scripts

### docs/ updates

- Each service file under `docs/03 - Microservices/` gets a **Testing** subsection listing:
  - Pytest markers to use
  - What unit vs integration tests cover
  - Known edge cases surfaced during test writing
- No new doc files — updates go into existing service docs

---

## 6. Out of Scope

- Frontend (Next.js) component/E2E tests — not requested
- Performance/load testing — not requested
- CI/CD pipeline integration — not requested (test commands are CI-ready but pipeline config not in scope)
