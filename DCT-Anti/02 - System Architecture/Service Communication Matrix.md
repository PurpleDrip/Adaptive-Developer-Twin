---
tags: [architecture]
---

# Service Communication Matrix

> Every cross-service call. If a call exists in code and isn't here, the matrix is **wrong** — open a [[13 - Yet to Implement/_MOC|punch list]] item.

Rows = **caller**. Columns = **callee**. ✓ = active call. — = no direct call.

| ↓Caller \\ Callee→ | Gateway | Auth | Telemetry | Fusion | THG | Allocation | Analytics | Monitoring | Task |
|:------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| **Gateway** | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Auth** | — | — | — | ✓ | ✓ | — | — | — | — |
| **Telemetry** | — | ✓ | — | ✓ | ✓ | — | — | ✓ | — |
| **Fusion** | — | — | — | — | ✓ | — | — | — | — |
| **THG** | — | — | — | — | — | — | — | — | — |
| **Allocation** | — | — | — | ✓ | ✓ | — | — | — | — |
| **Analytics** | — | — | — | — | ✓ | — | — | — | — |
| **Monitoring** | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| **Task** | — | ✓ | — | ✓ | ✓ | ✓ | — | — | — |

## Call detail (endpoint × purpose)

### Auth → other

| Endpoint called | Purpose | Trigger |
|:---|:---|:---|
| `POST {THG}/api/v1/thg/create-dev` | Add developer node | After successful registration |
| `POST {THG}/api/v1/thg/create-manager` | Add manager node | After admin creates manager |
| `POST {THG}/api/v1/thg/link-manager-dev` | MANAGES edge | After `assign_manager` |
| `POST {FUSION}/api/v1/fusion/analyze-project` | Baseline skill from GitHub | Background task on registration with `github_project_urls` |

### Telemetry → other

| Endpoint called | Purpose | Trigger |
|:---|:---|:---|
| `POST {AUTH}/.../validate-extension` | Authorize ingest | Every `/ingest` and `/handshake` |
| `POST {FUSION}/api/v1/fusion/deep-audit` | One-shot workspace scan | When `sync_type=INITIAL` + `workspace_snapshot_url` present |
| `POST {FUSION}/api/v1/fusion/{user_id}/run` | Aggregated batch → skill update | Every BatchProcessor tick (default 5 min) |
| `POST {THG}/api/v1/thg/update` | Persist skill change | Per skill in fusion result |
| `GET {MONITORING}/system-config` | Pull live config | Every BatchProcessor tick |

### Fusion → other

| Endpoint called | Purpose | Trigger |
|:---|:---|:---|
| `POST {THG}/api/v1/thg/update` | Push skill update from `analyze-project` or `deep-audit` |

### Allocation → other

| Endpoint called | Purpose | Trigger |
|:---|:---|:---|
| `POST {FUSION}/api/v1/fusion/analyze-text` | Vectorize task description | Every `/rank` call |
| `GET {THG}/api/v1/thg/developers` | Pull candidate pool | Every `/rank` and `/optimize` |
| `POST {THG}/api/v1/thg/record-assignment` | Confirm assignment | `/select` |

### Task → other

| Endpoint called | Purpose | Trigger |
|:---|:---|:---|
| `GET {AUTH}/.../squad/{manager_id}` | Squad members | `/match` |
| `POST {ALLOCATION}/rank` | Rank candidates | `/match`, `/create` |
| `POST {THG}/api/v1/thg/task/create` | Create graph node | `/create` |
| `POST {THG}/api/v1/thg/record-assignment` | Confirm | `/{task_id}/assign` |
| `GET {THG}/api/v1/thg/task/user/{dev_id}` | List dev tasks | `/user/{user_id}` |

### Analytics → other

| `GET {THG}/api/v1/thg/leaderboard/{skill}` | Leaderboard data |
| `GET {THG}/api/v1/thg/influence` | EVC ranking |
| (team queries) | Read Neo4j directly via shared driver |

### Monitoring → other

| Endpoint | Purpose |
|:---|:---|
| `GET {service}/api/v1/{service}/health` | Health rollup for `/system-health` |

---

## Failure modes

For each cell with ✓: see [[12 - Expert Review/Reliability Loopholes]] — currently most calls have **no retry**, **no circuit breaker**, **no timeout cap**. This is a P1 gap.

See [[13 - Yet to Implement/Backend - All - Resilient HTTP Client]].
