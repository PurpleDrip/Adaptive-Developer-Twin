---
tags: [yet-to-implement, p1]
status: pending
priority: P1
estimate: 1 week
---

# Infra — CI Pipeline

## Why
No CI today. Bug regressions caught by users.

## Acceptance criteria
- [ ] GitHub Actions (or GitLab CI) workflows per [[09 - Operations/CI-CD Pipeline]]
- [ ] PR jobs: lint, unit tests, integration tests, secret scan, container scan
- [ ] Main jobs: build images, push to registry, deploy to staging
- [ ] Manual approval → prod canary
- [ ] Branch protection on `main`

## Files involved
- `.github/workflows/*.yml`
- `Makefile` for local equivalents

## Tracked from
[[09 - Operations/CI-CD Pipeline]]
