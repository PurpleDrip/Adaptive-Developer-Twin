---
tags: [yet-to-implement, p1, privacy]
status: pending
priority: P1
estimate: 2 days
---

# Backend — Telemetry — Retention Policy

## Why
`telemetry_raw` grows unbounded. Need cold tier + delete.

## Acceptance criteria
- [ ] Mongo TTL index: `telemetry_raw.ingested_at + 30 days`
- [ ] Nightly job: export rows aged 30-90 days to S3 (gzipped JSONL); delete from hot
- [ ] After 120 days total: cold rows also deleted
- [ ] Same for `telemetry_batches` with 1y hot / 7y cold

## Files involved
- `scripts/lifecycle/telemetry_archive.py` (new)
- IaC: cron / scheduled task

## Tracked from
[[08 - Security & Compliance/Data Retention]]
