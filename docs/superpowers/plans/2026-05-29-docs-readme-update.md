# Docs & README Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update `README.md` with accurate project structure, testing commands, and Docker instructions. Add a "Testing" subsection to each of the 9 service docs in `docs/03 - Microservices/`.

**Architecture:** All updates go into existing files — no new docs created. README gets a new "Testing" section and updated "Project Structure" block. Each service doc gets a `## Testing` section appended.

**Tech Stack:** Markdown only.

---

## File Map

```
README.md                                          ← modify (structure, testing, docker)
docs/03 - Microservices/Auth Service.md            ← append ## Testing section
docs/03 - Microservices/Telemetry Service.md       ← append ## Testing section
docs/03 - Microservices/Fusion Service.md          ← append ## Testing section
docs/03 - Microservices/THG Service.md             ← append ## Testing section
docs/03 - Microservices/Allocation Service.md      ← append ## Testing section
docs/03 - Microservices/Analytics Service.md       ← append ## Testing section
docs/03 - Microservices/Monitoring Service.md      ← append ## Testing section
docs/03 - Microservices/Task Service.md            ← append ## Testing section
docs/03 - Microservices/Gateway Service.md         ← append ## Testing section
```

---

## Task 1: Update README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Read current README**

```bash
cat README.md
```

Note the current sections so the update doesn't duplicate content.

- [ ] **Step 2: Update Project Structure section**

Find the project structure block in `README.md` and replace it (or add one if absent) with:

```markdown
## Project Structure

```
ADT-v1/
├── backend/                  # 9 FastAPI microservices
│   ├── auth/                 # Authentication & user management (port 8001)
│   ├── telemetry/            # Telemetry ingestion & batch processing (port 8002)
│   ├── fusion/               # AI skill analysis engine (port 8003)
│   ├── thg/                  # Temporal Heterogeneous Graph — Neo4j (port 8004)
│   ├── allocation/           # Task-developer matching engine (port 8005)
│   ├── analytics/            # Burnout prediction, leaderboard, HR reports (port 8006)
│   ├── monitoring/           # System config, audit log, health (port 8007)
│   ├── task/                 # Task creation and assessment (port 8008)
│   └── gateway/              # API gateway, IP whitelist, CORS (port 8000)
├── frontend/                 # Next.js 16 web application
├── extension/                # VS Code extension (ADT telemetry collector)
├── shared/                   # Shared Pydantic models, DB clients, RBAC
├── scripts/                  # Operational scripts (seed, approve-devices)
├── postman/                  # API test collection (Newman-compatible)
├── docs/                     # Project knowledge base
├── docker-compose.yml        # Full stack orchestration
└── pytest.ini                # Root test runner config
```
```

- [ ] **Step 3: Update Docker section**

Find or add a Docker section:

```markdown
## Running with Docker

```bash
# Copy and fill environment variables
cp .env.example .env

# Start all services (backend + frontend)
docker compose up --build

# Start only backend services
docker compose up --build telemetry-service fusion-service thg-service \
  allocation-engine analytics-service monitoring-service task-service \
  gateway-service auth-service
```

Services available at:
| Service    | Port |
|------------|------|
| Gateway    | 8000 |
| Auth       | 8001 |
| Telemetry  | 8002 |
| Fusion     | 8003 |
| THG        | 8004 |
| Allocation | 8005 |
| Analytics  | 8006 |
| Monitoring | 8007 |
| Task       | 8008 |
| Frontend   | 3000 |
```

- [ ] **Step 4: Add Testing section**

Append to `README.md`:

```markdown
## Testing

### Backend (Python — pytest)

```bash
# Install test dependencies
pip install -r requirements-test.txt

# Unit tests only (no DB required — runs anywhere)
pytest -m unit -v

# Algorithm tests (no DB required)
pytest -m algorithm -v

# Integration tests (requires .env with live MongoDB, Neo4j, Redis)
pytest -m integration -v

# Everything
pytest -v

# Single service
pytest backend/fusion/test/ -v
pytest backend/auth/test/ -v
```

### VS Code Extension (TypeScript — Mocha)

```bash
cd extension

# Unit tests (no VS Code required)
npm run test:unit

# Integration pipeline tests
npm run test:integration

# E2E tests (headless VS Code)
npm run test:e2e
```

### Postman / Newman

```bash
# Install Newman
npm install -g newman

# Run against direct services (each service on its own port)
newman run postman/ADT-Complete-Test-Suite.postman_collection.json \
  -e postman/environments/ADT-Direct-Services.postman_environment.json

# Run through gateway only
newman run postman/ADT-Complete-Test-Suite.postman_collection.json \
  -e postman/environments/ADT-Gateway.postman_environment.json
```

### Scripts

```bash
# Seed the Neo4j graph with developer + manager nodes
python scripts/seed_production_demo.py

# Add a device to the hardware whitelist
python scripts/approve_devices.py

# Run backend services without Docker
./scripts/run_backend.ps1

# Set up backend Python environments
./scripts/setup_backend.ps1
```
```

- [ ] **Step 5: Commit README changes**

```bash
git add README.md
git commit -m "docs: update README with accurate structure, docker, and testing sections"
```

---

## Task 2: Add Testing Sections to Service Docs

**Files:**
- Modify: all 9 files under `docs/03 - Microservices/`

- [ ] **Step 1: Update Auth Service doc**

Open `docs/03 - Microservices/Auth Service.md` and append:

```markdown
---

## Testing

**Test location:** `backend/auth/test/`

### Unit tests (`pytest -m unit`)
- `test/unit/test_models.py` — `UserRegistrationDTO` and `LoginDTO` field validation, missing required fields, type coercion
- `test/unit/test_services.py` — login polymorphic lookup logic mocked against three collections

### Integration tests (`pytest -m integration`)
- `test/integration/test_routes.py` — all 17 routes tested with FastAPI `AsyncClient`; DB mocked via `mongomock`

### Postman
All auth endpoints are in the **Auth Service** folder of `ADT-Complete-Test-Suite.postman_collection.json`, including negative cases for duplicate registration, wrong password, and missing fields.

### Known edge cases surfaced during testing
- Password is bcrypt-hashed at 72-byte limit; passwords longer than 72 bytes produce identical hashes — no validation enforced at the API layer (by design, but worth documenting)
- `assign-manager` requires both user and manager to exist in their respective collections — 404 on either returns a 500 if not handled
```

- [ ] **Step 2: Update Telemetry Service doc**

Append to `docs/03 - Microservices/Telemetry Service.md`:

```markdown
---

## Testing

**Test location:** `backend/telemetry/test/`

### Unit tests (`pytest -m unit`)
- `test/unit/test_batch_processor.py` — `BatchProcessor` init, config fetch, paused-monitoring early exit, no-data early exit

### Integration tests (`pytest -m integration`)
- `test/integration/test_routes.py` — handshake, ingest, status routes with mocked MongoDB

### Postman
**Telemetry Service** folder — handshake (valid + missing params), ingest (valid batch + empty body negative), status check.

### Known edge cases surfaced during testing
- `ingest` endpoint is IP-whitelisted at the gateway level; direct-to-service calls bypass this check
- `BatchProcessor` reschedules on config change — only testable with a running scheduler (integration/E2E only)
```

- [ ] **Step 3: Update Fusion Service doc**

Append to `docs/03 - Microservices/Fusion Service.md`:

```markdown
---

## Testing

**Test location:** `backend/fusion/test/`

### Algorithm tests (`pytest -m algorithm`)
- `test/unit/test_anomaly_detector.py` — `check_human_jitter` (bot/human/erratic/insufficient), `analyze_batch` (batch size guard), `compute_composite_reliability` (60/40 weighting)
- `test/unit/test_weight_engine.py` — `calculate_skill_score` (normalization, unknown sources), `fuse_all_skills` (confidence = available/4)
- `test/unit/test_bayesian_fusion.py` — `calculate_posterior_confidence` (unit interval clamping, larger sample = higher confidence), `batch_update` (all skills processed)

### Integration tests (`pytest -m integration`)
- `test/integration/test_routes.py` — analyze-text returns vector dict, missing body returns 422, fusion run for user

### Known edge cases surfaced during testing
- `AnomalyDetector` model is not pre-trained on startup; first batch with < 10 records triggers `fit_predict` on itself (cold-start bias)
- `WeightEngine` unknown sources get weight 0.10; adding a new evidence source without updating `DEFAULT_WEIGHTS` silently under-weights it
- `BayesianFuser.calculate_posterior_confidence`: `security` domain has the highest beta prior (3.0) — new developers will have lower initial confidence in security than other domains
```

- [ ] **Step 4: Update THG Service doc**

Append to `docs/03 - Microservices/THG Service.md`:

```markdown
---

## Testing

**Test location:** `backend/thg/test/`

### Unit tests (`pytest -m unit`)
- `test/unit/test_schemas.py` — `SkillUpdateRequest` field validation, strength out-of-range detection

### Integration tests (`pytest -m integration`)
- `test/integration/test_routes.py` — health, create-dev (valid + missing id), get-developers, update-skill, create-task, match-task

### Postman
**THG Service** folder — all 7 graph endpoints including negative cases.

### Known edge cases surfaced during testing
- `update-skill` with `strength > 1.0` may pass schema validation without clamping — the route should enforce [0,1] bounds
- `match-task` returns empty list for an unknown `task_id` instead of 404 — consumers must handle empty candidates gracefully
```

- [ ] **Step 5: Update Allocation Service doc**

Append to `docs/03 - Microservices/Allocation Service.md`:

```markdown
---

## Testing

**Test location:** `backend/allocation/test/`

### Algorithm tests (`pytest -m algorithm`)
- `test/unit/test_skill_matcher.py` — cosine similarity: identical (→1.0), orthogonal (→0.0), empty (→0.0), partial overlap
- `test/unit/test_workload_optimizer.py` — Hungarian algorithm: perfect match, below-threshold skip (< 0.2), empty matrix

### Integration tests (`pytest -m integration`)
- `test/integration/test_routes.py` — rank endpoint with valid task description, empty body (422)

### Known edge cases surfaced during testing
- `SkillMatcher.get_task_vector` falls back to keyword heuristic if Fusion is down — heuristic produces sparse binary vectors, degrading match quality silently
- `WorkloadOptimizer` threshold is 0.2 (hard-coded) — any task-developer pair below this is never assigned, even if it's the best available match
```

- [ ] **Step 6: Update Analytics Service doc**

Append to `docs/03 - Microservices/Analytics Service.md`:

```markdown
---

## Testing

**Test location:** `backend/analytics/test/`

### Algorithm tests (`pytest -m algorithm`)
- `test/unit/test_burnout_predictor.py` — insufficient data (< 7 days), output range [0,1], status boundary conditions (healthy/at_risk/critical), trend key
- `test/unit/test_success_predictor.py` — high match → high probability, low match → low probability, heuristic method when untrained

### Integration tests (`pytest -m integration`)
- `test/integration/test_routes.py` — team-skills, leaderboard, stats, feedback, hr-reports, weekly test submission

### Known edge cases surfaced during testing
- `BurnoutPredictor` GRU model is untrained at runtime (no `.pth` loaded) — all predictions use random weights, making burnout scores meaningless until a trained model is loaded
- `SuccessPredictor` XGBoost model is similarly untrained — heuristic mode used with confidence=0.6; `_is_trained` flag is never set to True by any code path
- Both predictors need model loading wired up before production use (see `docs/13 - Yet to Implement/`)
```

- [ ] **Step 7: Update Monitoring Service doc**

Append to `docs/03 - Microservices/Monitoring Service.md`:

```markdown
---

## Testing

**Test location:** `backend/monitoring/test/`

### Unit tests (`pytest -m unit`)
- `test/unit/test_middleware.py` — (for gateway IP whitelist; monitoring has no complex isolated logic to unit-test)

### Integration tests (`pytest -m integration`)
- `test/integration/test_routes.py` — system-config GET/PUT, audit-log, system-health, holiday declaration

### Postman
**Monitoring Service** folder — 6 requests including config update and health check.

### Known edge cases surfaced during testing
- `PUT /system-config` does not validate that `batch_interval_minutes` is a positive integer — a value of 0 or negative would cause the scheduler to spin at maximum frequency
- WebSocket audit stream (`/ws/audit`) is not covered by REST tests — requires a WebSocket client for full coverage
```

- [ ] **Step 8: Update Task Service doc**

Append to `docs/03 - Microservices/Task Service.md`:

```markdown
---

## Testing

**Test location:** `backend/task/test/`

### Unit tests (`pytest -m unit`)
- `test/unit/test_services.py` — squad-scoped isolation logic, client call mocking

### Integration tests (`pytest -m integration`)
- `test/integration/test_routes.py` — health, match preview, create task, assessment routes (422 on missing body)

### Postman
**Task Service** folder — match preview, create task (valid + incomplete body), health check.

### Known edge cases surfaced during testing
- `match` and `create` both call Allocation + THG + Auth in sequence — if any downstream service is down, the task service returns a 500 rather than a partial result
- Assessment anti-cheat: a user can only submit each test once; the uniqueness check is on `(user_id, test_id)` pair in MongoDB — duplicate key error on second submission
```

- [ ] **Step 9: Update Gateway Service doc**

Append to `docs/03 - Microservices/Gateway Service.md`:

```markdown
---

## Testing

**Test location:** `backend/gateway/test/`

### Unit tests (`pytest -m unit`)
- `test/unit/test_ip_whitelist.py` — `IPWhitelistMiddleware._is_allowed`: localhost allowed, CIDR ranges, external IPs blocked, invalid IP blocked, empty whitelist blocks all

### Integration tests (`pytest -m integration`)
- `test/integration/test_proxy.py` — proxy routing, CORS preflight, IP block via `X-Forwarded-For`

### Postman
**Gateway** folder — health (via proxy), CORS preflight, IP block test with spoofed `X-Forwarded-For: 8.8.8.8`.

### Known edge cases surfaced during testing
- Whitelist is fetched from monitoring service and cached for 5 minutes — a misconfigured monitoring service will cause the gateway to use stale or default whitelist (`["127.0.0.1", "::1", "10.0.0.0/8"]`)
- `X-Forwarded-For` is trusted without validation — a client behind a proxy can spoof their IP by setting this header; the gateway should only trust it from known reverse-proxy IPs
```

- [ ] **Step 10: Commit all doc updates**

```bash
git add "docs/03 - Microservices/"
git commit -m "docs: add Testing sections to all 9 service docs with edge cases"
```

---

## Task 3: Final Verification

- [ ] **Step 1: Check all doc files were updated**

```bash
grep -l "## Testing" "docs/03 - Microservices/"*.md | wc -l
```

Expected: `9` (all nine service docs have a Testing section).

- [ ] **Step 2: Check README has Testing section**

```bash
grep -c "## Testing" README.md
```

Expected: `1`

- [ ] **Step 3: Commit final state**

```bash
git add .
git commit -m "docs: complete docs and README update — testing, structure, docker sections"
```
