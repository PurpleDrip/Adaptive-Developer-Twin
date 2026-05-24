---
tags: [observability]
---

# Env Vars — Master List

## Shared (every service)

| Name | Default | Required | Purpose |
|:-----|:--------|:--------:|:--------|
| `MONGO_URI` | `mongodb://adt_admin:adt_mongo_pass@localhost:27017/adt_db?authSource=admin` | ✓ | Mongo connection string |
| `MONGO_DB_NAME` | `adt_db` | – | Default DB name |
| `LOG_LEVEL` | `INFO` | – | Service log level |

## Per service

### Gateway (`:8000`)

| Name | Required | Purpose |
|:-----|:--------:|:--------|
| `AUTH_URL` | ✓ | upstream |
| `TELEMETRY_URL` | ✓ | upstream |
| `FUSION_URL` | ✓ | upstream |
| `THG_URL` | ✓ | upstream |
| `ALLOCATION_URL` | ✓ | upstream |
| `TASK_URL` | ✓ | upstream |
| `ANALYTICS_URL` | ✓ | upstream |
| `MONITORING_URL` | ✓ | upstream |
| `CORS_ORIGINS` | – | comma-separated allowlist |

### Auth (`:8001`)

| Name | Required | Purpose |
|:-----|:--------:|:--------|
| `FUSION_URL` | ✓ | bg analyze-project |
| `THG_URL` | ✓ | create-dev / link |
| `REDIS_URL` | ✓ | sessions |

### Telemetry (`:8002`)

| Name | Required | Purpose |
|:-----|:--------:|:--------|
| `FUSION_URL` | ✓ | batch processor |
| `THG_URL` | ✓ | skill writes |
| `AUTH_URL` | ✓ | validate-extension |
| `MONITORING_URL` | ✓ | live config |
| `REDIS_URL` | – | future cache |
| `BATCH_INTERVAL_MINUTES` | – | scheduler (default 5) |

### Fusion (`:8003`)

| Name | Required | Purpose |
|:-----|:--------:|:--------|
| `THG_URL` | ✓ | skill writes |
| `HF_HOME` | – | huggingface cache dir |

### THG (`:8004`)

| Name | Required | Purpose |
|:-----|:--------:|:--------|
| `NEO4J_URI` | ✓ | `neo4j+s://...` |
| `NEO4J_USER` | ✓ | |
| `NEO4J_PASSWORD` | ✓ | |

### Allocation (`:8005`)

| Name | Required | Purpose |
|:-----|:--------:|:--------|
| `THG_URL` | ✓ | dev pool |
| `FUSION_URL` | ✓ | analyze-text |

### Analytics (`:8006`)

| Name | Required | Purpose |
|:-----|:--------:|:--------|
| `THG_URL` | ✓ | |
| `FUSION_URL` | ✓ | |
| `REDIS_URL` | – | cache |
| `NEO4J_URI` / `USER` / `PASSWORD` | ✓ | direct reads |

### Monitoring (`:8007`)

| Name | Required | Purpose |
|:-----|:--------:|:--------|
| (all `*_URL`) | ✓ | health rollup |
| `REDIS_URL` | ✓ | pub/sub |

### Task (`:8008`)

| Name | Required | Purpose |
|:-----|:--------:|:--------|
| `THG_URL` | ✓ | task/assignment |
| `ALLOCATION_URL` | ✓ | ranking |
| `FUSION_URL` | – | (future) |
| `AUTH_URL` | ✓ | squad lookup |
| `REDIS_URL` | – | future cache |

### Extension (VS Code settings, not env)

| Setting | Default |
|:--------|:--------|
| `adt.gatewayUrl` | `http://127.0.0.1:8000` |
| `adt.extensionId` | `""` (stored in secrets in prod) |

## .env.example template

```bash
# ===== Persistence =====
MONGO_URI=mongodb+srv://...
MONGO_DB_NAME=adt_db
NEO4J_URI=neo4j+s://...
NEO4J_USER=neo4j
NEO4J_PASSWORD=...
REDIS_URL=rediss://...

# ===== Service URLs (compose) =====
AUTH_URL=http://auth-service:8000
TELEMETRY_URL=http://telemetry-service:8000
FUSION_URL=http://fusion-service:8000
THG_URL=http://thg-service:8000
ALLOCATION_URL=http://allocation-engine:8000
ANALYTICS_URL=http://analytics-service:8000
MONITORING_URL=http://monitoring-service:8000
TASK_URL=http://task-service:8000

# ===== Gateway =====
CORS_ORIGINS=https://app.example.com,https://demo.example.com

# ===== Telemetry =====
BATCH_INTERVAL_MINUTES=5

# ===== Logging =====
LOG_LEVEL=INFO
```
