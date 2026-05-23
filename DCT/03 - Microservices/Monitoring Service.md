---
tags: [service, observability]
aliases: [Monitoring]
---

# Monitoring Service

## Identity

| | |
|:---|:---|
| Port | `8007` → `8000` |
| Hostname | `monitoring-service` |
| Code | `backend/monitoring/` |
| Entry | `backend/monitoring/app/main.py` |
| Health | `GET /api/v1/monitoring/health` |

## Responsibilities

- **System config** — global heartbeat & batch interval, mutable by tech admin
- **Audit log API** — historical query of `audit_logs`
- **System health rollup** — health-pings every other service
- **Batch processing status** — last N telemetry batches
- **Live Audit HUD backend** — Redis pub/sub → WebSocket (planned)

## Routes

| Method | Path | Handler | Purpose |
|:-------|:-----|:--------|:--------|
| GET | `/system-config` | `get_system_config()` | Returns `system_config{_id:global}` or defaults |
| PUT | `/system-config` | `update_system_config(config)` | Upsert |
| GET | `/audit-log?user_id=&action=&limit=100` | `get_audit_trail(...)` | Historical audit query |
| GET | `/system-health` | `get_system_health()` | Pings every service's `/health` |
| GET | `/batch-status` | `get_batch_processing_status()` | Last 10 batches |
| (planned) | `WS /ws/audit` | — | Live audit stream |

## Models / DTOs

- `SystemConfig {heartbeat_interval_seconds: 30, batch_interval_minutes: 5}` — defaults in `shared/models/system_config.py`
- Audit entries follow [[06 - Data Models/DTO - Audit Log]]

## Services / Business logic

### `AuditLogger` (`shared/services/audit_logger.py`)

- `log_thg_update(...)`
- `log_action(action, by, payload)`
- `get_recent(limit)`
- `get_by_action(action, limit)`

Used by **every other service** to write audit rows. The `audit_logs` collection is the durable counterpart to the Redis pub/sub channel.

### `get_system_health()` rollup

Iterates `SERVICE_URLS` from env, fires a `GET /health` at each with 5 s timeout. Builds:

```json
{
  "status": "healthy" | "degraded" | "down",
  "timestamp": "...",
  "services": {
    "auth": { "status": "ok", ... },
    "telemetry": "unhealthy",
    "fusion": "offline",
    ...
  }
}
```

Status rules:

- All `ok` → `healthy`
- 1–3 down → `degraded`
- ≥4 down → `down`

## Database

| Mongo Collection | Indexes |
|:-----------------|:--------|
| `system_config` | `key` unique |
| `audit_logs` | `timestamp` desc, `(user_id, timestamp)`, `action` |

| Redis | Purpose |
|:------|:--------|
| `audit:stream` | pub/sub channel |

## Env vars

All other services' URLs (for health rollup) + `MONGO_URI` + `REDIS_URL`.

## Outbound calls

`GET /api/v1/{service}/health` to every other service.

## Background tasks

(Planned) Redis pub/sub subscriber feeding the WS endpoint.

## Known gaps

- **WS not yet wired** — the audit stream isn't pushed to the UI in realtime ([[13 - Yet to Implement/Backend - Monitoring - WS Audit Stream]])
- **No alerting** — `/system-health` is pull-only; no push to PagerDuty / Slack
- **No retention policy** on `audit_logs` — collection will grow unbounded
- **System config has no audit** — `PUT /system-config` doesn't log who changed what (ironic!). P0. ([[13 - Yet to Implement/Backend - Monitoring - Audit System Config]])
