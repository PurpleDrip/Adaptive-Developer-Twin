---
tags: [performance, risk-scale]
---

# Scalability Loopholes

> Pinch points at 10k devs and 100k devs.

## At 10k devs

| Concern | Current behavior | At 10k |
|:--------|:-----------------|:-------|
| Ingest | 333 req/s, single Mongo write each | OK with M30+ |
| Batch processor | 10k records / 5 min | OK |
| Fusion | one /run per user per 5 min → 2000 calls / 5 min = 6.7/s | OK if CodeBERT warm |
| THG writes | ~8 per user per batch → 16k writes / 5 min | OK |
| Allocation `/rank` | reads ALL devs each call | **NOT OK** — 1s+ p99 |
| Audit log writes | mirrors every state change | OK |
| Snapshots | INITIAL on first install only | OK |

**Hottest pain point**: Allocation `/rank` reads `GET /thg/developers` every call → linear scan of all 10k devs in Neo4j. Add cache (5-min TTL) → fine.

## At 100k devs

| Concern | Behavior | Mitigation |
|:--------|:---------|:-----------|
| Ingest | 3333 req/s | Shard Mongo by `user_id`; horizontal scale telemetry pods |
| Batch processor | 100k records / 5 min | Partition by user prefix; one processor per partition; or run more often (1 min) |
| Fusion | 20k calls / 5 min = 67/s | **CodeBERT becomes the bottleneck.** Need batch inference + GPU + Triton |
| THG writes | 160k / 5 min | Neo4j write throughput limit; consider write-behind cache |
| Allocation | 10× the cost | Pre-computed candidate sets per skill; only reranking real-time |
| Audit log | 100× | Time-bucket the indexes; consider dedicated audit DB |
| Snapshots | 100× more storage | Tiered storage; cheaper archive |

## Specific bottlenecks

### CodeBERT inference

- Single-pass on CPU: ~50ms
- Single-pass on GPU: ~5ms
- Batch of 32 on CPU: ~600ms (≈19ms per item)
- Batch of 32 on GPU: ~30ms (≈1ms per item)

**P1**: Batch mode at ingest time — collect snippets from 32 batches, run once.
**P2**: GPU + Triton inference server.

### Mongo `telemetry_raw` pile

A 10k-dev org generates ~10M rows/month. Indexes alone could be hundreds of MB. Retention policy → cold storage → keep hot < 30 days.

### Neo4j hot edges

`HAS_SKILL` has 80k edges (10k × 8 skills) at 10k devs. Cypher MERGE + decay calc is bounded; not a problem. At 1M devs, consider edge property tables in Neo4j or shard by community.

### Gateway

Stateless. Scales trivially. Just add pods.

## Mitigation roadmap

Each at-scale concern → punch-list item:

- [[13 - Yet to Implement/Backend - Allocation - Dev Cache]]
- [[13 - Yet to Implement/Backend - Fusion - Batch CodeBERT]]
- [[13 - Yet to Implement/Backend - Fusion - GPU + Triton]]
- [[13 - Yet to Implement/Backend - Telemetry - Parallel Batch Users]]
- [[13 - Yet to Implement/Backend - Telemetry - Leader Election]]
- [[13 - Yet to Implement/Backend - Telemetry - Retention Policy]]
- [[13 - Yet to Implement/Infra - Mongo Sharding]]

## Load test plan

Tier-1 bar: 10k concurrent extensions sustained for 1 hour without:

- p99 ingest > 200ms
- batch lag > 600s
- any 5xx > 0.1%

Tracked: [[13 - Yet to Implement/Infra - Load Test Harness]].
