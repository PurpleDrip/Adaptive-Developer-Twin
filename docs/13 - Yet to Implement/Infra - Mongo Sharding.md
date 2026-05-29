---
tags: [yet-to-implement, p2, performance]
status: pending
priority: P2
estimate: 2 weeks
---

# Infra — Mongo Sharding

## Why
At 100k+ devs, single-cluster Mongo hits ceiling on `telemetry_raw` writes.

## Acceptance criteria
- [ ] Shard key: `user_id` (hashed)
- [ ] Migrate `telemetry_raw` and `telemetry_batches` to sharded collections
- [ ] Re-tune indexes for shard-key-included queries
- [ ] Tests: ingest throughput scales linearly with shards

## Files involved
- IaC (Atlas sharded cluster config)
- `shared/database/mongo.py` (no app change ideally)

## Tracked from
[[12 - Expert Review/Scalability Loopholes#At 100k devs]]
