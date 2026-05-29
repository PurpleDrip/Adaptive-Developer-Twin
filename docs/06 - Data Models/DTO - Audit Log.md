---
tags: [dto, schema-mongo, observability]
---

# DTO — Audit Log

`audit_logs` collection. Append-only. Used by [[03 - Microservices/Monitoring Service|Monitoring]] for the Live Audit HUD + historical queries.

## Wire shape

```json
{
  "_id": "ObjectId",
  "ts": "ISO 8601",
  "action": "skill_update | task_assigned | ... (see Glossary of actions)",
  "by": "user_id | service_name",
  "source": "telemetry | fusion | thg | task | auth | monitoring",

  "user_id": "uuid | null",
  "dev_id": "uuid | null",
  "batch_id": "string | null",
  "task_id": "uuid | null",

  "before": { ... },
  "after": { ... },
  "details": { ... }
}
```

## Action catalog

| `action` | Source | Required fields |
|:---------|:-------|:----------------|
| `user_registered` | auth | user_id, by |
| `extension_locked` | auth | user_id, details: { ext_id, machine_id } |
| `extension_unlocked` | auth | user_id, by |
| `skill_update` | telemetry, task | dev_id, batch_id?, details: { skill, before, after } |
| `fraud_flag` | fusion | dev_id, batch_id, details: { reliability_score } |
| `task_created` | task | task_id, by |
| `task_assigned` | task | task_id, dev_id, by |
| `task_completed` | task | task_id, dev_id |
| `task_reviewed` | task | task_id, by, details: { verdict } |
| `assessment_issued` | task | dev_id, details: { skill, difficulty } |
| `assessment_completed` | task | dev_id, details: { score, skill_delta } |
| `system_config_changed` | monitoring | by, before, after |
| `data_explorer_write` | auth (admin) | by, details: { collection, doc_id, field, before, after } |
| `handshake_mismatch` | telemetry | user_id, details: { sent_hash, stored_hash } |
| `thg_developer_created` | auth | dev_id, by |
| `thg_manager_linked` | auth | manager_id, dev_id, by |

## Indexes

- `timestamp desc` — Live HUD initial backfill
- `(user_id, timestamp)` — Per-user timeline
- `action` — Filter by action type
- `(dev_id, action, timestamp)` — (planned) Targeted forensic queries

## Retention

> Today: **no retention policy** — grows unbounded.

Target:

- **Hot**: 90 days in Mongo
- **Cold**: rolled to object storage (S3/MinIO) for the next 7 years (regulatory)
- **Tombstones**: GDPR erase replaces `user_id`/`dev_id` with `"<deleted-uuid>"` but preserves the action history (compliance vs. erase tension)

Tracked: [[13 - Yet to Implement/Backend - Monitoring - Audit Retention Policy]].

## Why append-only

Mutating an audit log defeats its purpose. We disable updates at the application layer (`AuditLogger` has no `update`/`delete` methods), and the Mongo role used by the service has only `insert`+`find` privileges. Tracked: [[13 - Yet to Implement/Backend - Monitoring - Mongo Role Insert Only]].
