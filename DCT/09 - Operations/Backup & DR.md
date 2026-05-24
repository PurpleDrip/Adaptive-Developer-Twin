---
tags: [reliability]
---

# Backup & DR

## RPO / RTO targets

| Store | RPO | RTO |
|:------|:---:|:---:|
| MongoDB Atlas | ≤ 5 min (continuous backup) | ≤ 1 hour |
| Neo4j AuraDB | ≤ 24 h (daily snapshot) | ≤ 4 hours |
| Redis Upstash | ∞ (ephemeral) | 0 (re-login) |
| Object storage (snapshots) | 0 (versioned bucket) | 0 (immediate) |

## Procedures

### Mongo restore

1. Atlas → Backup → Restore to point-in-time
2. Choose target cluster (don't restore in place)
3. Atlas creates the restored copy alongside; verify with read-only queries
4. Update `MONGO_URI` in K8s secret to point at new cluster
5. Rolling restart all services
6. Verify with [[Runbook - DB Outage]] runbook smoke tests

### Neo4j restore

1. AuraDB → Snapshots → choose latest pre-incident
2. AuraDB creates clone DB
3. Update `NEO4J_URI` secret
4. Rolling restart of THG + Analytics
5. Smoke test: `MATCH (n) RETURN count(n)`

### Redis

No DR. Redis is **assumed ephemeral**. Sessions invalidate → users re-login. Pub/sub channels reconnect from clients.

### Object storage

S3 versioning + cross-region replication. Restore via `aws s3 cp` from the replica region.

## Backup verification

Monthly automated test:

1. Spin up `staging-restore` cluster from latest backup
2. Run smoke suite against it
3. Verify counts match expected (within 5 min of backup time)
4. Tear down

A backup that hasn't been restored isn't a backup.

## DR drill (quarterly)

Full game-day exercise:

1. Pick a region to "simulate failure" — kill the primary cluster
2. Promote DR region (or restore in alternate region)
3. Update DNS / routing
4. Verify the full ingest → fusion → dashboard flow works
5. Document time-to-recovery in runbook log
6. Restore primary; tear down DR

Tracked: [[13 - Yet to Implement/Infra - DR Drill Quarterly]].
