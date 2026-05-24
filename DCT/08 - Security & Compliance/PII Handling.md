---
tags: [security, privacy, compliance]
---

# PII Handling

## What counts as PII (in this product)

| Field | Where it lives | PII? |
|:------|:---------------|:-----|
| `name` | users / managers / tech_staff | Yes |
| `email` | same | Yes (direct) |
| `phone_number` | same | Yes (direct) |
| `gender` | same | Yes (special category in some jurisdictions) |
| `github_project_urls` | users | Yes (linked identity) |
| `machine_id` | whitelist | Yes (device identifier) |
| `code_snippet` | telemetry_raw | **Potential** (may contain PII via comments) |
| `top_files` (file paths) | telemetry_batches | **Potential** (paths can leak names) |
| `audit_log.before/after` | audit_logs | **Inherits** sensitivity of mutated field |
| `workspace_snapshot_url` content | object storage | **Yes** (full source) |

## Rules

1. **PII never in logs.** Log structured events with IDs, not names.
2. **PII access via service API only.** No direct DB queries for cross-service PII reads — go through Auth.
3. **No PII in keys / paths / URLs.** UUIDs only.
4. **Snippet sanitization** — secret scanner before send (P0 — [[Code Snippet & Snapshot Safety]]).
5. **Email lowercasing on save** — prevents `Alice@x.com` vs `alice@x.com` ambiguity.

## Per-data-flow PII review

| Flow | PII present? | Handling |
|:-----|:-------------|:---------|
| Registration | Yes (all the above) | TLS in transit, bcrypt for pw, plaintext-validated server-side, then encrypted at rest |
| Telemetry ingest | Snippets + file paths | Sanitization (P0), encryption at rest |
| Skill update | No (just dev_id, skill name, numbers) | – |
| Task assign | No (IDs only) | – |
| Live audit HUD | dev names possibly | UI shows IDs by default; flip to names with role-gated toggle |

## Right to access (GDPR Article 15)

Every developer can request:

```
GET /api/v1/auth/users/me/export
```

Returns a JSON bundle of:

- Their profile doc
- All `telemetry_raw` records (with `code_snippet` included)
- All `telemetry_batches` for them
- All `audit_logs` where `dev_id == them`
- All THG nodes & edges connected to their Developer node
- (Workspace snapshots: signed URLs to the object storage zips)

> ⚠️ **Not implemented today.** Tracked: [[13 - Yet to Implement/Compliance - GDPR Data Export]].

## Right to erasure (GDPR Article 17)

```
DELETE /api/v1/auth/users/me   (developer-initiated)
DELETE /api/v1/auth/admin/users/{id}  (admin, with reason)
```

Behavior:

1. **Mongo**: delete `users` doc; tombstone `audit_logs` (replace `user_id`/`dev_id` with `"<erased>"`)
2. **Mongo**: delete `telemetry_raw`, `telemetry_batches`, `project_analyses` for this user
3. **Neo4j**: `MATCH (d:Developer {id})-[r]-() DELETE r DELETE d`
4. **Redis**: delete `reg_session:*` and `session:*` for user
5. **Object storage**: list and delete all `workspace_snapshot_url` blobs
6. **Backups**: out-of-band — see [[Data Retention#Backups & GDPR]]
7. Final audit entry: `action: user_erased, by: <id>, scope: full`

> ⚠️ **Not implemented today.** Tracked: [[13 - Yet to Implement/Compliance - GDPR Right to Erase]].

## "Soft erase" for ex-employees

When a dev leaves the org but org needs to keep aggregate analytics:

- `users.is_active = false`
- `users.deactivated_at = now()`
- THG dev stays; activity decays naturally; doesn't show on leaderboards (`WHERE d.is_active = true`)
- After org's data-retention period, full erase

## PII minimization

We collect what we need:

- ✓ `gender` — used for inclusive language and analytics; could be opt-in
- ✓ `phone_number` — used for MFA; could be opt-in
- ⚠ Reassess every field every 6 months. If unused → drop.
