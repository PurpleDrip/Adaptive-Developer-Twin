---
tags: [yet-to-implement, p1, security]
status: pending
priority: P1
estimate: 2 days
---

# Infra — KMS Setup

## Why
Per-tenant key encryption needs a KMS (AWS KMS, GCP KMS, HashiCorp Vault Transit).

## Acceptance criteria
- [ ] Per-tenant KEK created on tenant provisioning
- [ ] Envelope encryption helpers reference these
- [ ] Audit log of unwrap operations
- [ ] Key rotation policy 90 days

## Files involved
- IaC
- `shared/crypto/envelope.py` (new)

## Tracked from
[[08 - Security & Compliance/Encryption at Rest & Transit#Envelope encryption pattern]]
