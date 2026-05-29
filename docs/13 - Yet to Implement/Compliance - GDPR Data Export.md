---
tags: [yet-to-implement, p0, compliance, privacy]
status: pending
priority: P0
estimate: 4 days
---

# Compliance — GDPR Data Export

## Why
Article 15: developer can request all data we hold on them. Today there's no endpoint.

## Acceptance criteria
- [ ] `GET /api/v1/auth/users/me/export` (dev-initiated)
- [ ] Returns a JSON bundle (or signed URL to a zip in object storage) containing:
  - Profile doc from `users`
  - All `telemetry_raw` records (snippets included)
  - All `telemetry_batches`
  - All `audit_logs` where `dev_id == them`
  - THG nodes and edges connected to their Developer
  - Snapshot signed URLs (with 24h TTL)
- [ ] Generation runs as background job for users with >10k records; UI shows progress
- [ ] Audit: `action=data_exported, by=<id>`
- [ ] Tests: round-trip — register, ingest 100 pings, export, verify all 100 in bundle

## Files involved
- `backend/auth/app/routers/users.py`
- `backend/auth/app/services/export.py` (new — orchestrator)

## Tracked from
[[08 - Security & Compliance/PII Handling#Right to access GDPR Article 15]]
