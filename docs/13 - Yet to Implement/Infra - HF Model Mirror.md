---
tags: [yet-to-implement, p2, reliability]
status: pending
priority: P2
estimate: 4 hours
---

# Infra — HF Model Mirror

## Why
Fusion's first start downloads `microsoft/codebert-base` from Hugging Face. If HF is down, new pods fail.

## Acceptance criteria
- [ ] Mirror model files to private S3 / OCI registry
- [ ] `HF_HOME` points at the mirror in prod
- [ ] Update procedure documented

## Files involved
- IaC (model bucket)
- `backend/fusion/Dockerfile` (mirror env)
- `backend/fusion/download_model.py`

## Tracked from
[[09 - Operations/Runbook - Fusion Engine Stuck#Step 2]]
