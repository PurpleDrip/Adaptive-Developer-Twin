---
tags: [yet-to-implement, p0, security]
status: pending
priority: P0
estimate: 1 day
---

# Backend — Fusion — SSRF Guard

## Why
`analyze-project` and `deep-audit` take URLs from external input. Without guards, attacker can point them at internal services or cloud metadata endpoints.

## Acceptance criteria
- [ ] `analyze-project` accepts only `github_url` matching `^https://github\.com/[^/]+/[^/]+/?$`
- [ ] `deep-audit` accepts only **opaque snapshot_id**, resolved internally to a signed S3 URL (see [[Backend - Telemetry - Snapshot Storage]])
- [ ] All HTTP clients in Fusion forbid private IP ranges (10/8, 172.16/12, 192.168/16, 127/8, 169.254/16) in resolved DNS
- [ ] Tests: request with `github_url=http://169.254.169.254/...` rejected with 400

## Files involved
- `backend/fusion/app/routers/fusion.py` (URL validation)
- `backend/fusion/app/services/http_client.py` (new — wrapped httpx with DNS guard)

## Tracked from
[[08 - Security & Compliance/OWASP Coverage#API7]]
