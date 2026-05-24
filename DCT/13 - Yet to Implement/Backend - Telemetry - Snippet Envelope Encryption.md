---
tags: [yet-to-implement, p0, security]
status: pending
priority: P0
estimate: 3 days
---

# Backend — Telemetry — Snippet Envelope Encryption

## Why
`code_snippet` is plaintext in `telemetry_raw`. A read of the collection leaks customer source. Envelope encryption (per-record DEK + KMS-wrapped KEK) compartments the blast radius.

## Acceptance criteria
- [ ] On INSERT: generate per-record DEK, encrypt snippet, wrap DEK with tenant KEK from KMS, store ciphertext + wrapped_dek
- [ ] On READ (Fusion only): unwrap DEK via KMS, decrypt snippet
- [ ] No other service can read decrypted snippets
- [ ] KMS calls audit-logged
- [ ] Re-key (rotate KEK) is a separate background job that re-wraps DEKs

## Files involved
- `backend/telemetry/app/services/crypto.py` (new — envelope helper)
- `backend/telemetry/app/routers/telemetry.py` (encrypt on ingest)
- `backend/fusion/app/services/snippet_loader.py` (decrypt on read)
- IaC: KMS setup ([[Infra - KMS Setup]])

## Tracked from
[[08 - Security & Compliance/Encryption at Rest & Transit#Envelope encryption pattern]]
