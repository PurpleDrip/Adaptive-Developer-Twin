---
tags: [architecture]
---

# Data Flow — Telemetry Pipeline

The bread-and-butter path. Optimized for throughput; failures are absorbed, not propagated.

## Stages

```mermaid
flowchart LR
    A[Extension<br/>collects 30 s window] --> B[SHEC handshake<br/>POST /handshake]
    B -->|synchronized| C[POST /ingest<br/>raw record]
    B -->|mismatch| D[Snapshot resync<br/>POST /ingest sync_type=INITIAL]
    C --> E[(telemetry_raw<br/>processed=false)]
    D --> E
    E --> F[BatchProcessor<br/>every BATCH_INTERVAL_MINUTES]
    F --> G[Group by user_id]
    G --> H[Aggregate signals]
    H --> I[POST fusion/{user_id}/run]
    I --> J{reliability_score}
    J -->|≥ threshold| K[Per-skill THG update]
    J -->|< threshold| L[fraud_flag · audit · no THG write]
    K --> M[(THG · Neo4j)]
    K --> N[audit_logs]
    F --> O[(telemetry_batches)]
    F --> P[Mark raw · processed=true]
```

## Phase 1 — handshake (SHEC)

> *SHEC = State Hash & Extension Check*

The extension computes a hash of its "last known good" state (file list, cursor, branch). It POSTs that hash + `extension_id` + `machine_id`. Telemetry checks the stored `last_known_state_hash`:

- **Match** → `{status: "synchronized"}` → extension sends `DELTA`
- **Mismatch** → `{status: "mismatch", last_known_hash}` → extension sends a fresh `INITIAL` with workspace snapshot

This protocol detects:

- Extension reinstall on same machine (lost local state)
- Machine change (will fail [[07 - Algorithms/SHA-HWID Anchor|SHA-HWID]] first)
- Long offline window where the world drifted

## Phase 2 — ingest

Auth-gate first:

```
POST {AUTH_URL}/api/v1/auth/users/validate-extension {extension_id, machine_id}
```

Returns the `user_id` (joins extension to user). Telemetry then writes [[06 - Data Models/DTO - Telemetry Raw|TelemetryRawDocument]] with `processed=false`. **No fusion, no THG**.

For `sync_type=INITIAL` with `workspace_snapshot_url`, telemetry also fires off `/deep-audit` (best-effort, no blocking).

## Phase 3 — batch

The [[07 - Algorithms/SWEF-Ingestion (Sliding Window)|BatchProcessor]] wakes every `BATCH_INTERVAL_MINUTES` (default 5).

1. Pull `system_config.batch_interval_minutes` — re-schedule self if changed.
2. `SELECT { processed: false } LIMIT 10000`.
3. Group by `user_id`.
4. For each user-group:
   - Build a `batch_id = "BATCH-{YYYYMMDDHHMM}-{user_id[:8]}"`
   - Aggregate to [[06 - Data Models/DTO - Telemetry Batch|TelemetryBatchDocument.aggregated_signals]]
   - `POST {FUSION}/api/v1/fusion/{user_id}/run` with the signals

## Phase 4 — fusion

Fusion returns `{ reliability_check, skill_updates: { skill: { confidence, explanation, fraud_flag? }}}`.

For each skill with `strength > 0.01`:

```
POST {THG}/api/v1/thg/update {dev_id, skill_name, strength, confidence}
```

And `INSERT audit_logs` (one per skill change).

## Phase 5 — finalize

- `telemetry_batches.{fusion_result, thg_updates, status: "completed", processed_at}` saved.
- `telemetry_raw` records stamped with `batch_id`, `processed: true`.

## Latency budgets

| Stage | Target |
|:------|:-------|
| `/handshake` | < 50 ms p99 |
| `/ingest` | < 200 ms p99 |
| Batch loop (10k records) | < 60 s p99 |
| Fusion `/run` (per user) | < 800 ms p99 |
| THG `/update` (single skill) | < 80 ms p99 |

If any of these slip, batches stack up → `lag` rises → see [[09 - Operations/Runbook - Batch Processor Drift]].

## What can go wrong (known gaps)

- **No retry on Fusion failure** — batch is marked `failed`, raw rows are stuck at `processed=false` (replayable on next tick if we mark them — currently we don't; see [[12 - Expert Review/Reliability Loopholes#Fusion failure leaves orphan raw]]).
- **No dead-letter queue** — repeatedly failing batches keep retrying ([[13 - Yet to Implement/Backend - Telemetry - DLQ]]).
- **No rate limit on `/ingest`** — a misbehaving extension can flood ([[13 - Yet to Implement/Backend - Gateway - Rate Limiting]]).
