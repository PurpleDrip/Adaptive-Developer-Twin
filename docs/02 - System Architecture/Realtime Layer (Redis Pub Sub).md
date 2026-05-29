---
tags: [architecture, observability]
---

# Realtime Layer (Redis Pub/Sub)

## The job

Stream events from the backend to the **Tech Admin Live Audit HUD** without blocking writers. Pillar #9 — [[07 - Algorithms/Async-Redis-WS]].

## Channels

| Channel | Producer | Consumer | Payload shape |
|:--------|:---------|:---------|:--------------|
| `audit:stream` | All services (via [[shared/services/audit_logger]]) | Monitoring WS | `{ts, user_id, action, before, after, by, batch_id?, source}` |
| `telemetry:ingest` | Telemetry | Monitoring (optional, future) | `{ts, ext_id, sync_type, bytes}` |
| `fusion:batch` | Fusion | Monitoring (optional, future) | `{ts, user_id, batch_id, reliability_score}` |

## Topology

```mermaid
sequenceDiagram
    participant SVC as Any service (e.g., Fusion)
    participant LOGGER as AuditLogger (shared)
    participant REDIS as Redis pub/sub
    participant MON as Monitoring (WS server)
    participant UI as Tech Admin Dashboard
    SVC->>LOGGER: log_thg_update({...})
    LOGGER->>+REDIS: PUBLISH audit:stream <json>
    LOGGER->>MONGO: INSERT audit_logs (durable)
    LOGGER-->>SVC: ok
    REDIS-->>MON: SUBSCRIBE event
    MON-->>UI: WS push (JSON)
    UI->>UI: render row in Live Audit HUD
```

## Guarantees

- **At-most-once delivery** to subscribers (Redis pub/sub). Durability is in Mongo `audit_logs`.
- **Order**: per-publisher process. Not globally ordered across replicas.
- **Backpressure**: subscriber that can't keep up will drop events. **Mitigation**: subscriber must also poll `audit_logs` after reconnect to catch up.

## Why pub/sub and not streams?

- Streams (`XADD`/`XREAD`) give durable, replayable history. We get that from Mongo already.
- Pub/sub is cheaper, lower-latency, and fits the "live HUD" UX exactly.

If durable replay becomes a frontend requirement (e.g., scroll-back the last 24 h of audit events), upgrade to Redis Streams + Mongo for cold storage. Tracked: [[13 - Yet to Implement/Infra - Redis Streams for Audit Replay]].
