---
tags: [reliability]
---

# Runbook — DB Outage

## Symptoms

- All services reporting Mongo / Neo4j / Redis timeouts
- `/api/v1/auth/users/login` returning 503
- `/api/v1/monitoring/system-health` showing `degraded` or `down`

## Step 1 — Identify which store

```bash
# Check Atlas
curl -u $ATLAS_KEY:$ATLAS_SECRET https://cloud.mongodb.com/api/atlas/v2/clusters/$CLUSTER

# Check AuraDB
# Aura Console → cluster status

# Check Upstash
# Upstash Console → database overview
```

Or in Grafana: `up{job="<store>"}` panel.

## Step 2 — Per-store mitigation

### Mongo Atlas

- Atlas dashboard → look for incident notice
- If cluster healthy but slow → check connection pool: `mongo_pool_size` saturated?
- If outage → switch to DR cluster (warm standby) via `MONGO_URI` rotation

### Neo4j AuraDB

- Aura console for incidents
- If slow → check active sessions, query plans
- If GDS-related → endpoints fall back automatically ([[07 - Algorithms/Native Cypher Fallback]])
- If outage → restore from latest snapshot (RTO 4h — see [[Backup & DR]])

### Redis Upstash

- Upstash console
- Sessions impacted → users re-login; expected behavior
- Pub/sub impacted → audit HUD goes blank; backfill from Mongo `audit_logs` covers historical

## Step 3 — Drop write load if needed

If the DB is alive but overloaded:

```bash
# Block ingest at gateway via a feature flag
flag set ingest_enabled=false

# Now Mongo gets breathing room
# Wait for queues to drain
# Re-enable in stages
flag set ingest_enabled=true rate=0.1
flag set ingest_enabled=true rate=0.5
flag set ingest_enabled=true rate=1.0
```

Tracked: [[13 - Yet to Implement/Infra - Feature Flags]].

## Step 4 — Audit gap

If `audit_logs` couldn't be written for N minutes:

1. Note the gap in the postmortem
2. Re-derive from `telemetry_batches` if possible (the batch doc has the fusion_result + thg_updates info)
3. Insert reconciliation entries with `details: { reconciled_from: "telemetry_batches" }`

## Step 5 — Communicate

If user-facing impact > 5 min: status page + email.

## Tested?

Backup restore drills monthly. DR drills quarterly. See [[Backup & DR#DR drill quarterly]].
