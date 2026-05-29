---
tags: [dto, performance]
---

# Index Strategy

> Indexes shape latency. Wrong indexes are silent until they aren't. Maintain this note as the source of truth.

## Hot read paths

### `GET /thg/skills/{dev_id}` (Dashboard)

Cypher uses `Developer(id)` constraint → O(1) node lookup, then walk HAS_SKILL edges (bounded by ~8 skills/dev).

### `POST /telemetry/ingest`

Mongo: `INSERT telemetry_raw` (no read). Hot path is the cross-service `POST /validate-extension`. Auth side uses `extension_id` unique index → O(log n).

### `GET /telemetry/status/{ext_id}`

`COUNT { processed: false, extension_id: $eid }` — composite `(extension_id, processed)` would speed this up; today uses two single-key indexes. Tracked: [[13 - Yet to Implement/Backend - Telemetry - Status Composite Index]].

### Batch processor "fetch unprocessed"

```js
db.telemetry_raw.find({ processed: false }).limit(10000)
```

Currently uses `processed` index only. At 10 M unprocessed records, this is fine. At 1 B, partition by date.

### `GET /thg/leaderboard/{skill}`

Index `()-[r:HAS_SKILL]-() ON (r.strength)` makes this O(log n + 10).

### `GET /thg/developers` (Allocation hot path)

This is a **full scan** today — every call retrieves all dev nodes + all HAS_SKILL edges. For 10 k devs, ~1 s p99. Add caching in Allocation ([[13 - Yet to Implement/Backend - Allocation - Dev Cache]]) and consider an aggregation view in THG.

## Hot write paths

### `INSERT telemetry_raw`

No bottleneck at 10 k devs × 1 ping/30 s = 333 writes/s. Atlas M30 handles 5 k writes/s comfortably.

### `INSERT audit_logs`

Append-only, indexed by `timestamp desc`. Write-amplification is minor.

### `MERGE Developer-HAS_SKILL->Skill`

Two MERGEs + edge SET. Neo4j AuraDB handles 1 k+ /s on a Pro tier.

## Indexes to add (P1)

| Collection | Index | Reason |
|:-----------|:------|:-------|
| `telemetry_raw` | `(extension_id, processed)` | Status endpoint |
| `audit_logs` | `(dev_id, action, timestamp)` | Targeted user-action timeline |
| `tasks` | `(assigned_to, status)` | Open-tasks-by-dev query |
| `project_analyses` | `(user_id, status, analyzed_at desc)` | Latest analysis lookup |

## Indexes to remove (P2)

None today. Watch out — over-indexing slows writes. Re-audit at 100 k records.
