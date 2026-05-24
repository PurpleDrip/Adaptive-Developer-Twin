---
tags: [compliance, privacy]
---

# Data Retention

## Policy table

| Collection / store | Hot | Cold | Total | After expiry |
|:-------------------|:---:|:----:|:-----:|:-------------|
| `users` / `managers` / `tech_staff` | indefinite (while active) | – | – | Hard delete on GDPR erase or N months after `is_active=false` |
| `whitelist` | indefinite | – | – | Delete with user |
| `telemetry_raw` | 30 days | 90 days (cold storage) | 120 days | Hard delete |
| `telemetry_batches` | 1 year | 7 years | 7 years | Aggregated to monthly rollups then delete |
| `project_analyses` | 1 year | 7 years | 7 years | Delete on GDPR erase |
| `tasks` | indefinite (while active) | – | – | Archive after `completed_at + 2y` |
| `weekly_tests` | 2 years | 7 years | 7 years | Aggregated then delete |
| `audit_logs` | 90 days | 7 years | 7 years | Object-locked S3, no delete |
| `system_config` history | indefinite | – | – | Snapshot-only writes; never overwrite |
| Redis sessions | TTL-bound | – | – | Auto-expire |
| Workspace snapshots | 7 days | – | – | Delete with `project_analyses` |

## Lifecycle automation (target)

Mongo TTL indexes + scheduled job per collection:

```js
db.telemetry_raw.createIndex({ ingested_at: 1 }, { expireAfterSeconds: 30 * 86400 })
```

A nightly job moves "expiring soon" to cold:

```bash
mongoexport --collection=telemetry_raw --query='{ingested_at: {$lt: cutoff}}' | gzip | aws s3 cp - s3://...
db.telemetry_raw.deleteMany({ingested_at: {$lt: cutoff}})
```

> ⚠️ **Not implemented today.** Tracked: [[13 - Yet to Implement/Backend - All - Retention Automation]].

## Backups & GDPR

Backups create a real tension with the right-to-erase:

- GDPR allows a "reasonable period" for backups to age out
- Standard practice: 30-day backup window; erase recipients receive a written confirmation that erase takes full effect at 30 days

Document this in customer DPAs.
