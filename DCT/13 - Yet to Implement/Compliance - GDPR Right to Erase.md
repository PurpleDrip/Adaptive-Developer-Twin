---
tags: [yet-to-implement, p0, compliance, privacy]
status: pending
priority: P0
estimate: 1 week
---

# Compliance — GDPR Right to Erase

## Why
Article 17 requires erasure on request. Today there's no flow.

## Acceptance criteria
- [ ] `DELETE /api/v1/auth/users/me` (dev-initiated) + `DELETE /api/v1/auth/admin/users/{id}` (admin)
- [ ] Erase sequence per [[08 - Security & Compliance/PII Handling#Right to erasure GDPR Article 17]]:
  - Mongo: delete `users` doc; tombstone `audit_logs` (replace IDs with `"<erased>"`)
  - Mongo: delete `telemetry_raw`, `telemetry_batches`, `project_analyses`
  - Neo4j: `MATCH (d:Developer {id}) DETACH DELETE d`
  - Redis: delete all keys matching `*:user:{id}`
  - Object storage: list+delete all `workspace_snapshot_url` blobs for this user
- [ ] Backups: out-of-band note in DPA — backup window 30 days
- [ ] Confirmation email to user (asynchronous)
- [ ] Final audit entry: `action=user_erased, by=<id>, scope=full`
- [ ] Tests: end-to-end erase removes data from all stores; subsequent queries return 404

## Files involved
- `backend/auth/app/routers/users.py` + `routers/admin.py`
- `backend/auth/app/services/erase.py` (new — orchestrator)
- `shared/services/audit_logger.py` (tombstone helper)
- IaC: object storage list-and-delete IAM perms

## Tracked from
[[08 - Security & Compliance/Compliance Posture (GDPR, SOC2, ISO27001)#GDPR]] · [[12 - Expert Review/Top Risks (Ranked)#14]]
