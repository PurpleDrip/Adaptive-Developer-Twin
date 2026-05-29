---
tags: [dto, schema-redis]
---

# Redis Keys & Channels

## Keys

| Key | TTL | Owner | Shape | Purpose |
|:----|:---:|:------|:------|:--------|
| `reg_session:{session_id}` | 24 h | Auth | JSON dict | Partial registration draft |
| `session:{user_id}` (planned) | 1 h | Auth | JSON dict | Active user session (after JWT lands) |
| `whitelist:cache:{ext_id}` (planned) | 5 m | Telemetry | `{user_id, machine_id}` | Cached validate-extension result |
| `dev:cache:all` (planned) | 30 s | Allocation | JSON list | Cached `/thg/developers` for ranking |
| `health:cache` (planned) | 10 s | Monitoring | JSON | system-health rollup cache |

## Channels (pub/sub)

| Channel | Producer | Consumer | Payload |
|:--------|:---------|:---------|:--------|
| `audit:stream` | All services via [[shared/services/audit_logger]] | Monitoring WS subscriber | JSON `AuditEntry` |
| `telemetry:ingest` (planned) | Telemetry | Monitoring | `{ts, ext_id, sync_type, bytes}` |
| `fusion:batch` (planned) | Fusion | Monitoring | `{ts, user_id, batch_id, reliability}` |

## Key naming rules

1. **Always namespaced**: `<feature>:<scope>:<id>`. Never bare IDs.
2. **TTLs are explicit**. No unbounded keys.
3. **No PII in keys**. Use opaque IDs (uuids), not usernames or emails.
4. **JSON values**. Don't pack into custom delimiters.

See [[09 - Operations/Backup & DR#Redis]] for what we DR (nothing — Redis is ephemeral by design).
