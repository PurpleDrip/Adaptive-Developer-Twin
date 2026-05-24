---
tags: [yet-to-implement, p1, security]
status: pending
priority: P1
estimate: 1 week
---

# Infra — Secrets via Vault

## Why
`.env` files in containers. No rotation, no audit.

## Acceptance criteria
- [ ] HashiCorp Vault (or AWS Secrets Manager / Doppler) deployed
- [ ] Services fetch secrets at startup (or via Vault Agent Sidecar)
- [ ] Rotation policy per secret class ([[08 - Security & Compliance/Encryption at Rest & Transit#Key rotation]])
- [ ] Audit of secret reads
- [ ] No `.env` in prod containers

## Files involved
- IaC + Vault config
- `shared/secrets/loader.py` (new)

## Tracked from
[[08 - Security & Compliance/Secrets Management]]
