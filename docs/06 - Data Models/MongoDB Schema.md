---
tags: [dto, schema-mongo]
---

# MongoDB Schema

> Source of truth: `shared/database/mongo.py:_ensure_indexes()` + each service's models.

## Collections

### `users` — owner: [[03 - Microservices/Auth Service|Auth]]

```json
{
  "_id": "ObjectId",
  "user_id": "uuid4 hex",
  "extension_id": "uuid4 hex (unique, indexed)",
  "name": "string 2..100",
  "username": "string 3..50, ^[a-zA-Z0-9_]+$",
  "email": "string, lowercased, validated",
  "phone_number": "string 10..15",
  "gender": "Male | Female | Other",
  "password_hash": "bcrypt",
  "role": "developer",
  "experience_level": "Intern | Junior | Mid | Senior | Lead | Principal",
  "strong_domains": ["backend", "..."],
  "github_project_urls": ["url", "..."],
  "registered_at": "ISO 8601",
  "is_active": true,
  "project_analysis_status": "pending | running | done | failed",
  "machine_id": null | "string",
  "last_known_state_hash": null | "sha256",
  "last_sync_at": null | "ISO 8601"
}
```

**Indexes**:

- `user_id` unique
- `username` unique
- `email` unique
- `extension_id` unique

### `managers` — owner: Auth

```json
{
  "user_id": "uuid",
  "name": "string",
  "username": "string (unique)",
  "email": "string (unique)",
  "phone_number": "string",
  "gender": "string",
  "password_hash": "bcrypt",
  "role": "senior_manager | hrm | project_manager",
  "registered_at": "ISO",
  "is_active": true
}
```

**Indexes**: `user_id`, `username`, `email` (all unique).

### `tech_staff` — owner: Auth

Same shape as `managers` but `role ∈ { tech_admin, tech_support }`.

### `whitelist` — owner: Auth

```json
{
  "extension_id": "uuid (unique)",
  "user_id": "uuid",
  "machine_id": null | "hash",
  "issued_at": "ISO",
  "locked_at": null | "ISO",
  "locked_by": "system | tech_admin:<id>"
}
```

**Indexes**: `extension_id` unique, `(extension_id, machine_id)`.

### `telemetry_raw` — owner: [[03 - Microservices/Telemetry Service|Telemetry]]

See [[DTO - Telemetry Raw]] for the full shape.

**Indexes**: `(user_id, timestamp)`, `extension_id`, `processed`, `batch_id` (sparse).

### `telemetry_batches` — owner: Telemetry

See [[DTO - Telemetry Batch]].

**Indexes**: `batch_id` unique, `(user_id, window_start)`, `status`.

### `tasks` — owner: [[03 - Microservices/Task Service|Task]]

```json
{
  "task_id": "uuid",
  "title": "string",
  "description": "long text",
  "required_skills": { "backend": 0.8, "frontend": 0.3 },
  "status": "open | in_progress | done | reviewed | cancelled",
  "created_by": "manager_id",
  "created_at": "ISO",
  "assigned_to": null | "dev_id",
  "assigned_at": null | "ISO",
  "completed_at": null | "ISO",
  "review_notes": null | "string",
  "due_at": null | "ISO"
}
```

**Indexes**: `task_id` unique, `assigned_to` sparse, `created_by`, `status`.

> Today this collection is **unused** by code. Tracked: [[13 - Yet to Implement/Backend - Task - Mongo Tasks Collection]].

### `project_analyses` — owner: [[03 - Microservices/Fusion Service|Fusion]]

```json
{
  "user_id": "uuid",
  "github_url": "string",
  "analyzed_at": "ISO",
  "skill_signals": { "backend": 0.7, "..": 0.3 },
  "snippet_count": 124,
  "languages_seen": ["python", "yaml"],
  "status": "done | failed",
  "error": null | "string"
}
```

**Indexes**: `(user_id, analyzed_at)`.

### `weekly_tests` — owner: Task

```json
{
  "user_id": "uuid",
  "week_number": "ISO week id",
  "skill_targeted": "backend",
  "score": 0.74,
  "outcome": "pass | fail",
  "attempts": 1,
  "issued_by": "manager_id",
  "issued_at": "ISO",
  "completed_at": "ISO"
}
```

**Indexes**: `(user_id, week_number)`.

### `system_config` — owner: [[03 - Microservices/Monitoring Service|Monitoring]]

```json
{
  "_id": "global",
  "heartbeat_interval_seconds": 30,
  "batch_interval_minutes": 5,
  "working_hours": "09:00-17:00 IST",
  "fraud_threshold": 0.5,
  "updated_at": "ISO",
  "updated_by": "tech_admin:<id>"
}
```

**Indexes**: `_id` is the key (`"global"`).

### `audit_logs` — owner: Monitoring

See [[DTO - Audit Log]].

**Indexes**: `timestamp desc`, `(user_id, timestamp)`, `action`.

## Cross-cutting indexes (planned)

For analytics queries that scan batches:

- `telemetry_batches.aggregated_signals.top_files` text index (planned)
- `tasks.required_skills` (compound by skill name, for matching)
