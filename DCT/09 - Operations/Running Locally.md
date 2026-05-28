---
tags: [observability]
---

# Running Locally

## Prereqs

- Python 3.11+
- Node.js 18+
- A MongoDB Atlas free cluster
- A Neo4j AuraDB free instance
- A Upstash Redis free instance (for `rediss://` TLS support)
- VS Code (for extension dev)

## One-time setup

```powershell
# Backend
./scripts/setup_backend.ps1   # creates venv, installs deps for every service

# Copy env template
cp .env.example .env
# fill in MONGO_URI, NEO4J_URI/USER/PASSWORD, REDIS_URL

# Seed DBs (DESTRUCTIVE — wipes existing data)
python scripts/seed_production_demo.py
# Then in Neo4j Browser, paste contents of scripts/seed_thg.cypher

# Frontend
cd frontend-nextjs
npm install
```

## Daily run

```powershell
# All services in parallel
./scripts/run_backend.ps1

# Frontend
cd frontend-nextjs
npm run dev
```

Open http://localhost:3000.

## Run a single service

```powershell
cd backend/telemetry
.venv\Scripts\Activate.ps1
uvicorn app.main:app --port 8002 --reload
```

`--reload` hot-reloads on code change.

## Extension dev

```powershell
cd extension
npm install
npm run watch    # tsc -watch
# In VS Code: F5 to launch an Extension Development Host
# In the new window, set adt.gatewayUrl=http://127.0.0.1:8000
# Run command "ADT: Register Developer"
```

## Verify everything's up

```powershell
curl http://localhost:8000/health
curl http://localhost:8007/api/v1/monitoring/system-health | jq .
```

You should see `status: "healthy"` and every service reporting `ok`.

## Common issues

| Symptom | Fix |
|:--------|:----|
| `pymongo.errors.ServerSelectionTimeoutError` | Whitelist your IP in Atlas |
| `neo4j.exceptions.ServiceUnavailable` | Verify `NEO4J_URI` uses `neo4j+s://` not `bolt://` for AuraDB |
| `redis.exceptions.AuthenticationError` | Verify password in `REDIS_URL`; use `rediss://` for TLS |
| Gateway returns 502 | One of the upstreams is down — check `/system-health` |
| Extension can't connect | Check `adt.gatewayUrl` in VS Code settings + `CORS_ORIGINS` in `.env` |
| Fusion 6 s cold start | Expected — CodeBERT model load. Warm-up planned ([[13 - Yet to Implement/Backend - Fusion - Model Warm-up]]) |
| `ModuleNotFoundError: No module named 'app'` | Run `./scripts/run_backend.ps1` from **any directory** — script uses `$PSScriptRoot` to resolve paths. If services still fail, check that `.env` is in the project root (not `scripts/`). |
| Services connect to `localhost:27017` instead of Atlas | `.env` env vars were not propagated. Fixed in `run_backend.ps1` — each `Start-Job` now explicitly applies all `.env` key/value pairs before starting uvicorn. |
| Telemetry ingest returns `403 Access denied: not on authorised network` | Your machine IP is not in `office_network_whitelist` in system config. Add your IP/subnet via `PUT /api/v1/monitoring/system-config`. Default allows `127.0.0.1` and `10.0.0.0/8`. |
