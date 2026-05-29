---
tags: [reliability]
---

# Runbook — Batch Processor Drift

## Symptom

`batch_processor_lag_seconds > 600` for sustained period. Telemetry data arrives, but skills aren't updating.

## Quick triage

```bash
# What's the current lag?
curl -s https://api.../api/v1/monitoring/batch-status | jq .

# How many unprocessed raw records?
# (planned metric: unprocessed_raw_count)
```

## Causes (ranked by likelihood)

1. **Fusion slow** → see [[Runbook - Fusion Engine Stuck]]
2. **THG slow** → see [[Runbook - DB Outage#Neo4j AuraDB]]
3. **Mongo connection pool starved** in Telemetry service
4. **One user has 50k+ records** (e.g., a misbehaving extension)
5. **BatchProcessor crashed silently** (process alive but task dead)

## Mitigations

### #1 — Restart Telemetry

```bash
kubectl rollout restart deploy/telemetry-service
```

Forces APScheduler to re-register.

### #2 — Lift batch limit temporarily

Today: 10k records per tick. For catch-up, raise to 100k:

```bash
kubectl set env deploy/telemetry-service BATCH_LIMIT=100000
```

Tracked: [[13 - Yet to Implement/Backend - Telemetry - Lift Batch Limit]] for the actual env var.

### #3 — Quarantine the bad user

If one user is responsible for the pile-up:

```bash
# Identify
mongo $MONGO_URI --eval '
  db.telemetry_raw.aggregate([
    {$match: {processed: false}},
    {$group: {_id: "$user_id", count: {$sum: 1}}},
    {$sort: {count: -1}},
    {$limit: 5}
  ])
'

# Pause that user's ingest (planned endpoint)
curl -X POST https://api.../admin/users/{id}/pause-ingest

# Investigate why their pings are so dense
```

### #4 — Scale Telemetry horizontally

(Once BatchProcessor leader-election is done — currently it's not safe to run multiple)

Tracked: [[13 - Yet to Implement/Backend - Telemetry - Leader Election]].

## Post-incident

- Add the user's `extension_id` to a watch list
- Tune the alert threshold
- Document in postmortem
