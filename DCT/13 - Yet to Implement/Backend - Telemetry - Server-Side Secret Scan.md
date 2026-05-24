---
tags: [yet-to-implement, p0, security]
status: pending
priority: P0
estimate: 1 day
---

# Backend — Telemetry — Server-Side Secret Scan

## Why
Defense in depth: even if the extension missed a secret, the server should redact + alert.

## Acceptance criteria
- [ ] Same regex catalog as [[Extension - Secret Filter]]
- [ ] Scan runs on `code_snippet` + `diff_payload` at `/ingest`
- [ ] Match → replace with `<<REDACTED:{type}>>`, audit entry `action=secret_redacted, source=server`
- [ ] Notification to user (P1): "We found a secret in your telemetry. Rotate it."

## Files involved
- `backend/telemetry/app/services/secret_scanner.py` (new)
- `backend/telemetry/app/routers/telemetry.py` (call scanner)
- `shared/services/audit_logger.py` (new action type)

## Tracked from
[[08 - Security & Compliance/Code Snippet & Snapshot Safety]]
