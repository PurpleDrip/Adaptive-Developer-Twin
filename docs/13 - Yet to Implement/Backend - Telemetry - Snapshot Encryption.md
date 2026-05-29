---
tags: [yet-to-implement, p2, security]
status: pending
priority: P2
estimate: 2 days
---

# Backend — Telemetry — Snapshot Encryption

## Why
Workspace snapshots in object storage should be SSE-KMS.

## Acceptance criteria
- [ ] S3 bucket SSE-KMS (or equivalent) enabled
- [ ] Per-tenant KMS key
- [ ] Server access logs on the bucket
- [ ] Fusion's snapshot download uses the same KMS

## Files involved
- IaC (Terraform/CloudFormation)

## Tracked from
[[08 - Security & Compliance/Encryption at Rest & Transit]]
