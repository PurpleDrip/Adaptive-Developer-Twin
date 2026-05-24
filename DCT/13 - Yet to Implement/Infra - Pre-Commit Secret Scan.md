---
tags: [yet-to-implement, p1, security]
status: pending
priority: P1
estimate: 2 hours
---

# Infra — Pre-Commit Secret Scan

## Why
The only thing worse than a vulnerability in code is a secret in code.

## Acceptance criteria
- [ ] `pre-commit` framework configured
- [ ] `detect-secrets` hook + baseline
- [ ] `.secrets.baseline` committed
- [ ] CI also runs `gitleaks` against full history of PR branch
- [ ] Block merge on findings

## Files involved
- `.pre-commit-config.yaml`
- `.secrets.baseline`
- CI workflow

## Tracked from
[[08 - Security & Compliance/Secrets Management#Pre-commit secret scanning]]
