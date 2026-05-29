---
tags: [yet-to-implement, p2, security]
status: pending
priority: P2
estimate: 1 day
---

# Backend — Fusion — GitHub Hardening

## Why
`analyze-project` clones a GitHub repo. Needs pinned TLS, repo size cap, timeout.

## Acceptance criteria
- [ ] Pin github.com cert (HPKP-like local pinning)
- [ ] Repo size cap 200 MB
- [ ] Clone timeout 5 min
- [ ] Anonymous clone only (no PAT injection)
- [ ] Tests: 1GB repo rejected before clone completes

## Files involved
- `backend/fusion/app/services/project_analyzer.py`

## Tracked from
[[08 - Security & Compliance/OWASP Coverage#API10]]
