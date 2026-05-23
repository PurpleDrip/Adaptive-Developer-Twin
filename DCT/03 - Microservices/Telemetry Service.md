---
tags: [service]
aliases: [Telemetry]
---

# Telemetry Service

## Identity

| | |
|:---|:---|
| Port | `8002` → `8000` |
| Hostname | `telemetry-service` |
| Code | `backend/telemetry/` |
| Entry | `backend/telemetry/app/main.py` |
| Health | `GET /api/v1/telemetry/health` |

## Responsibilities

- **Ingest** raw telemetry pings from extensions
- **SHEC handshake** to detect drift
- **Batch processor** (every 5 min) aggregates raw → batches → fusion → THG
- **Deep audit trigger** on `sync_type=INITIAL` with snapshot

See [[02 - System Architecture/Data Flow - Telemetry Pipeline]].

## Routes

`prefix /api/v1/telemetry`

| Method | Path | Handler | Purpose |
|:-------|:-----|:--------|:--------|
| POST | `/handshake?extension_id=&current_hash=&machine_id=` | `telemetry_handshake` | SHEC — synchronized vs. mismatch |
| POST | `/ingest` | `ingest_telemetry(TelemetryIngestDTO)` | Persist one raw record |
| GET | `/status/{extension_id}` | `get_ingestion_status` | Unprocessed count |

## Models / DTOs

In `shared/models/telemetry.py`:

- `SyncType` enum — INITIAL · DELTA · FINAL
- [[06 - Data Models/DTO - Telemetry Raw|TelemetryIngestDTO]] — wire DTO
- `TelemetryRawDocument` — builds Mongo doc from DTO (adds `processed=false`, `ingested_at=now`)
- [[06 - Data Models/DTO - Telemetry Batch|TelemetryBatchDocument]] — aggregated batch shape

## Services / Business logic

### `BatchProcessor` (`backend/telemetry/app/services/batch_processor.py`)

The heart of the service.

- **APScheduler**, `IntervalTrigger(minutes=BATCH_INTERVAL_MINUTES)` (default 5).
- **`start()`** — register job on startup; re-read interval on each tick (live config).
- **`process_batches()`**:
  1. `GET {MONITORING}/system-config` → `batch_interval_minutes` may have changed
  2. `SELECT { processed: false } LIMIT 10_000`
  3. Group by `user_id`
  4. For each user group:
     - Build `batch_id`
     - Aggregate to `TelemetryBatchDocument.aggregated_signals`:
       - `avg_wpm = mean(wpm where wpm > 0)` — excludes idle pings to prevent unfair drag
       - `wpm_values = [all non-zero wpm]` — kept for variance analysis downstream
       - sums for keystrokes, commands, errors, errors_fixed, commits, idle_seconds, copy_paste
       - `top_files = merge(active_file → time_spent)` then sort desc, cap 20
       - `language_distribution = normalize(merge(languages_used))` (sums to 1.0)
       - `code_snippets = [up to 10 code samples]` — fed to CodeBERT
     - `POST {FUSION}/api/v1/fusion/{user_id}/run` with payload
     - For each skill in `fusion.skill_updates` with `strength > 0.01`:
       - `POST {THG}/update`
       - `INSERT audit_logs` (via [[shared/services/audit_logger]])
     - `INSERT telemetry_batches` with `fusion_result, thg_updates, status, created_at, processed_at`
     - Mark raw records: `UPDATE { processed=true, batch_id }`

## Database

| Collection | Indexes |
|:-----------|:--------|
| `telemetry_raw` | `(user_id, timestamp)`, `extension_id`, `processed`, `batch_id` sparse |
| `telemetry_batches` | `batch_id` unique, `(user_id, window_start)`, `status` |
| `audit_log` | (written via shared logger) |

## Env vars

| Name | Default | Purpose |
|:-----|:--------|:--------|
| `FUSION_URL` | — | for `/{user_id}/run` and `/deep-audit` |
| `THG_URL` | — | for `/update` writes |
| `AUTH_URL` | — | for `/validate-extension` |
| `MONITORING_URL` | — | for `/system-config` |
| `MONGO_URI`, `MONGO_DB_NAME` | shared | persistence |
| `REDIS_URL` | shared | future |
| `BATCH_INTERVAL_MINUTES` | `5` | scheduler cadence |

## Outbound calls

| To | Endpoint | When |
|:---|:---------|:-----|
| Auth | `POST /validate-extension` | every `/handshake` and `/ingest` |
| Fusion | `POST /deep-audit` | `/ingest` with snapshot |
| Fusion | `POST /{user_id}/run` | every batch loop |
| THG | `POST /update` | per skill in batch |
| Monitoring | `GET /system-config` | every batch loop |

## Background tasks

- `BatchProcessor` APScheduler job (in-process).

## Known gaps

- **No DLQ** for repeatedly failing batches — see [[13 - Yet to Implement/Backend - Telemetry - DLQ]]
- **No idempotency key** on `/ingest` — extension retries can double-write
- **No ingest rate limit** — flood vector
- **State hash check is process-local** — multiple telemetry pods would race; needs Redis for the state-hash lookup
- **Snapshot URL** is a blind trust — the extension says "here's a zip" and Fusion downloads it. P0 to add provenance + size cap. ([[13 - Yet to Implement/Backend - Telemetry - Snapshot Encryption]])

## Hot path budget

- `/ingest` should be **< 200 ms p99**
- BatchProcessor should drain 10 k records in **< 60 s**

If those slip → [[09 - Operations/Runbook - Batch Processor Drift]].
