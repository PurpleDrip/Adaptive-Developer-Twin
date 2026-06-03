# Adaptive Developer Twin (ADT)

ADT is an **Engineering Intelligence Platform** that builds a real-time "Neural Twin" of every developer in an organisation. It passively captures behavioral telemetry from the VS Code extension, runs it through a pipeline of 10 proprietary algorithms, and surfaces skill growth, influence maps, burnout risk, and task-allocation recommendations to managers and tech admins — without requiring developers to self-report anything.

---

## How it works

```
Developer types in VS Code
    │
    ▼
VS Code Extension (SHEC-encrypted heartbeat every N seconds)
    │
    ▼
API Gateway (:8000)  ←── CORS + IP whitelist + routing
    │
    ├── Auth Service (:8001)        — identity, hardware lock, sessions
    ├── Telemetry Service (:8002)   — ingest, SWEF sliding-window, batch queue
    ├── Fusion Service (:8003)      — CodeBERT + SCM-Audit, reliability scoring
    ├── THG Service (:8004)         — Neo4j Neural Twin, PageRank influence
    ├── Allocation Engine (:8005)   — vector-space candidate ranking
    ├── Analytics Service (:8006)   — leaderboard, composite scores, VDA burnout
    ├── Monitoring Service (:8007)  — system health, runtime config, audit log
    └── Task Service (:8008)        — task creation, CSA-matching, assessments

Persistence
    ├── MongoDB Atlas   — users, telemetry, batches, audit logs
    ├── Neo4j AuraDB    — skill graph, influence map, Neural Twin nodes
    └── Upstash Redis   — real-time pub/sub for Live Audit HUD
```

---

## The 10 Pillar Algorithms

| # | Algorithm | Service | What it does |
|:--|:----------|:--------|:-------------|
| 1 | **CodeBERT** | Fusion | Deep semantic analysis of code intent during repository audits |
| 2 | **SCM-Audit** | Fusion | AST-based parser mapping code changes to the THG skill taxonomy |
| 3 | **SWEF-Ingestion** | Telemetry | Sliding-window engine converting raw keystroke streams into WPM/productivity metrics |
| 4 | **SHA-HWID Anchor** | Auth | Cryptographic lock binding an Extension ID to a specific physical machine |
| 5 | **BGSC-Feedback** | Task | Guardrail ensuring skill upgrades are incremental and evidence-backed |
| 6 | **EVC-Influence** | THG | PageRank over the skill graph to surface organisational Knowledge Hubs |
| 7 | **CSA-Matching** | Task | Multi-dimensional vector engine for task-to-developer fit scoring |
| 8 | **VDA-Oversight** | Analytics | Regression model predicting burnout and velocity decay before they manifest |
| 9 | **Async-Redis-WS** | Monitoring | Non-blocking Redis pub/sub feeding the real-time Live Audit HUD |
| 10 | **Native Cypher** | THG | Fallback graph analytics when Neo4j GDS plugins are unavailable |

---

## Prerequisites

You need accounts on three free cloud services — no local database servers required.

| Service | Free tier | Used for |
|:--------|:----------|:---------|
| [MongoDB Atlas](https://www.mongodb.com/atlas) | 512 MB shared cluster | Users, telemetry, audit logs |
| [Neo4j AuraDB](https://neo4j.com/cloud/platform/aura-graph-database/) | 1 free instance | Neural Twin skill graph |
| [Upstash Redis](https://upstash.com/) | 10 K commands/day | Real-time audit pub/sub |

Local tools:
- Python 3.11+
- Node.js 18+
- PowerShell 7+ (Windows) or pwsh (Mac/Linux)
- VS Code (for extension development)

---

## Setup (one time)

### 1. Clone and configure environment

```powershell
git clone <repo-url>
cd ADT-v1

# Copy the template and fill in your credentials
cp .env.example .env
```

Open `.env` and replace every `REPLACE_ME` with real values:

| Variable | Where to find it |
|:---------|:----------------|
| `MONGO_URI` | Atlas → Connect → Drivers → copy the connection string |
| `NEO4J_URI` | AuraDB console → Connection URI (must start with `neo4j+s://`) |
| `NEO4J_USER` / `NEO4J_PASSWORD` | AuraDB → instance credentials |
| `REDIS_URL` | Upstash → your database → Connection → Redis URL (starts with `rediss://`) |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | Upstash → REST API tab |

> **MongoDB Atlas**: after creating the cluster, go to **Network Access** and whitelist your IP (or `0.0.0.0/0` for development).

### 2. Install backend dependencies

```powershell
# Creates a .venv inside every backend/* service and installs requirements
./scripts/setup_backend.ps1
```

### 3. Seed the databases

```powershell
# Wipes and re-seeds MongoDB with deterministic demo data (developers, managers, batches)
python scripts/seed_production_demo.py
```

Then open [Neo4j Browser](https://browser.neo4j.io) (or your AuraDB console), connect to your instance, and paste the contents of `scripts/seed_thg.cypher`. This builds the skill graph — without it, THG endpoints return empty results.

### 4. Install the frontend

```powershell
cd frontend
npm install
cd ..
```

### 5. Initialise the monitoring runtime config

The monitoring service stores two separate config documents. The runtime config (heartbeat intervals, pause flag, IP whitelist) lives at `_id: "global"` and must be created once:

```powershell
curl -X PUT http://localhost:8007/api/v1/monitoring/system-config `
  -H "Content-Type: application/json" `
  -d '{"heartbeat_interval_seconds": 30, "batch_interval_minutes": 5, "is_monitoring_paused": false, "shec_handshake_interval_ms": 5000, "office_network_whitelist": ["127.0.0.1", "::1", "10.0.0.0/8"]}'
```

(Run this after the backend is started for the first time.)

---

## Running the application

### Start all backend services

```powershell
# Launches all 9 microservices in parallel background jobs
./scripts/run_backend.ps1
```

Each service gets its own job. Logs appear in the terminal. Services are ready when you see `Application startup complete` from each.

### Start the frontend

```powershell
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Verify everything is running

```powershell
# Gateway health
curl http://localhost:8000/health

# Full service mesh status
curl http://localhost:8007/api/v1/monitoring/system-health
```

Expected: `{"status": "healthy", "services": {...all "ok"...}}`.

---

## Running a single service (for development)

```powershell
cd backend/telemetry
.venv\Scripts\Activate.ps1          # Windows
# source .venv/bin/activate          # Mac/Linux
uvicorn app.main:app --port 8002 --reload
```

Ports per service:

| Service | Port |
|:--------|:-----|
| Gateway | 8000 |
| Auth | 8001 |
| Telemetry | 8002 |
| Fusion | 8003 |
| THG | 8004 |
| Allocation | 8005 |
| Analytics | 8006 |
| Monitoring | 8007 |
| Task | 8008 |
| Frontend | 3000 |

---

## Role-based workflows

### Developer (`/dashboard`)

After registering, developers install the VS Code extension using the ID shown on the success screen. The extension sends encrypted heartbeats every 30 seconds. The dashboard shows:
- Real-time skill radar (8 axes)
- Global leaderboard with your rank
- Neural Twin evolution history
- Manager-issued assessments

### Project Manager (`/project-manager`)

Squad oversight console:
- Per-developer velocity and burnout risk (VDA score)
- AI task allocation via CSA-Matching
- Candidate vector comparison for task fit
- Squad influence graph

### Tech Admin (`/tech`)

Infrastructure command centre:
- Live Audit HUD — real-time feed of every system action
- MongoDB data explorer with edit capability
- System health across all 9 services
- Runtime config editor (heartbeat interval, IP whitelist, pause monitoring)
- **Manage Devs** — list all developers with their assigned manager; assign a manager to unassigned devs via a dropdown; filter by All / Assigned / Unassigned
- **Create Manager** — provision a new manager account directly into the `managers` collection

---

## VS Code Extension

The extension is the sole telemetry source. Developers do not manually submit anything.

### For end users (install from release)

1. Complete registration at `http://localhost:3000/register`
2. Copy your Extension ID shown on the success screen
3. Download the `.vsix` file (also on the success screen)
4. In VS Code: `Extensions → ··· → Install from VSIX`
5. Open VS Code settings and set `adt.gatewayUrl` to the gateway URL
6. Run the command **ADT: Register Developer** and paste your Extension ID

### For developers (run from source)

```powershell
cd extension
npm install
npm run watch          # TypeScript watch mode
# Press F5 in VS Code to launch Extension Development Host
# In the new window, set adt.gatewayUrl = http://127.0.0.1:8000
# Run command: ADT: Register Developer
```

### Build a new release

```powershell
cd extension
npm run package        # → releases/adt-extension-{version}.vsix
npm run package:pre    # → same but marked pre-release
```

---

## Simulation / Demo Mode

`/sim` is a fully self-contained investor demo that requires no backend. It shows the entire pipeline — typing in IDE → telemetry packets → Fusion processing → THG skill update → dashboard radar morph — in a 7-step scripted sequence.

Access it at [http://localhost:3000/sim](http://localhost:3000/sim) or via the "Watch the Live Demo" button on the landing page.

---

## Common issues

| Symptom | Fix |
|:--------|:----|
| `pymongo.errors.ServerSelectionTimeoutError` | Whitelist your IP in MongoDB Atlas → Network Access |
| `neo4j.exceptions.ServiceUnavailable` | `NEO4J_URI` must start with `neo4j+s://` (not `bolt://`) for AuraDB |
| `redis.exceptions.AuthenticationError` | `REDIS_URL` must start with `rediss://` (TLS) for Upstash |
| Gateway returns 502 | One upstream is down — check `curl http://localhost:8007/api/v1/monitoring/system-health` |
| Extension can't connect | Verify `adt.gatewayUrl` in VS Code settings and that `CORS_ORIGINS` in `.env` includes your frontend origin |
| `ModuleNotFoundError: No module named 'app'` | Run `./scripts/run_backend.ps1` from any directory — it uses `$PSScriptRoot` to find paths |
| Services connect to `localhost:27017` | `.env` must be in the project root (not `scripts/`). `run_backend.ps1` loads and forwards all `.env` vars to each job |
| Telemetry ingest returns `403 Access denied` | Your IP is not in `office_network_whitelist`. Add it via `PUT /api/v1/monitoring/system-config` |
| Fusion takes 6 s cold start | Expected — CodeBERT model load on first request. Subsequent calls are fast |
| Leaderboard shows no data | Run the seed script and make sure Fusion/THG services are up |

---

## Docker (optional)

All services have Dockerfiles. A `docker-compose.yml` is provided at the project root.

```powershell
# Build and start everything (all 9 backend services + frontend)
docker compose up --build
```

The compose stack starts all 9 backend services plus the Next.js frontend (`:3000`).

---

## Testing

### Backend (Python — pytest)

```powershell
# Install test dependencies (one time)
pip install -r requirements-test.txt

# Unit tests only — no DB required, runs anywhere
pytest -m unit -v

# Algorithm correctness tests — no DB required
pytest -m algorithm -v

# Integration tests — uses mocked DBs by default
pytest -m integration -v

# Everything
pytest -v

# Single service
pytest backend/fusion/test/ -v
```

Current status: **97 / 97 backend tests passing**. See [BUGS.md](BUGS.md) for design issues surfaced during the test-writing pass.

### VS Code Extension (TypeScript — Mocha)

```powershell
cd extension

npm run test:unit          # scanner, buffer, sender — no VS Code needed
npm run test:integration   # full pipeline (scanner → buffer → sender)
npm run test:e2e           # headless VS Code (requires path without spaces)
```

Current status: **29 / 29 extension unit + integration tests passing**.

### Postman / Newman

```powershell
# Install Newman
npm install -g newman

# Hit each service directly on its own port
newman run postman/ADT-Complete-Test-Suite.postman_collection.json `
  -e postman/environments/ADT-Direct-Services.postman_environment.json

# Route everything through the gateway (:8000)
newman run postman/ADT-Complete-Test-Suite.postman_collection.json `
  -e postman/environments/ADT-Gateway.postman_environment.json
```

The collection covers all **58 endpoints** across 9 services with positive and negative cases. The Auth folder must run first — it sets `user_id` and `extension_id` collection variables that downstream requests reuse.

---

## Documentation

The `docs/` folder is an Obsidian vault containing the full technical specification:
- **01 – Overview**: what ADT is, the 10 algorithms, stakeholders, roadmap
- **02 – Architecture**: data flows, sequence diagrams, service topology
- **03 – Microservices**: per-service deep dives (routes, models, env vars, testing)
- **04 – Extension**: collector, sender, SHEC protocol, hardware lock
- **05 – Frontends**: Next.js app routes, components, state management
- **06 – Data Models**: MongoDB collections, Neo4j schema, Redis keys, DTOs
- **07 – Algorithms**: detailed specs for all 10 pillars with math
- **08 – Security**: threat model, RBAC, PII handling, OWASP coverage
- **09 – Operations**: local setup, Docker, observability, runbooks
- **11 – Simulation Mode**: investor demo architecture and screen choreography
- **13 – Yet to Implement**: agent-actionable punch list (P0/P1/P2)

Open the `docs/` folder in [Obsidian](https://obsidian.md) for the best reading experience (wikilinks and graph view work out of the box).

---

## License

Proprietary — Adaptive Developer Twin Platform
