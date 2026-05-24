---
tags: [security, observability]
---

# Audit Logging

The schema is in [[06 - Data Models/DTO - Audit Log]]. This page is the **policy**.

## What gets logged

All **state mutations** + all **privileged reads**:

- Every skill update
- Every task create/assign/complete
- Every assessment issued/completed
- Every hardware lock / unlock
- Every system config change
- Every Data Explorer write
- Every login + login attempt (success and failure)
- Every cross-service permission denial
- Every fraud_flag

## What's NOT logged

- Routine reads (`GET /skills/{user_id}` for the user themselves)
- Periodic health checks
- Static asset requests

## Immutability

- Mongo role used by services has **insert + find** only — no `update` or `delete`
- Append-only enforced at app layer via `AuditLogger`'s missing methods
- Mongo journaling enabled; backup retention 7 years

## Tamper detection (P1)

Every entry includes a hash chain field:

```json
{
  ...entry fields...,
  "prev_hash": "<sha256 of previous entry>",
  "entry_hash": "<sha256 of this entry's content + prev_hash>"
}
```

Verification: a periodic job walks the chain and verifies hashes. A mutation anywhere breaks the chain from that point forward, immediately detectable.

Tracked: [[13 - Yet to Implement/Backend - Monitoring - Audit Hash Chain]].

## Retention

| Hot (Mongo) | Cold (S3, Glacier class) | Total |
|:-----------:|:-------------------------:|:-----:|
| 90 days | 7 years (regulatory) | 7 years |

After 90 days, entries are exported to S3 as JSONL files (one file per day), then deleted from hot. The S3 bucket has **object lock** for compliance.

## Access

| Role | Capability |
|:-----|:-----------|
| dev | Read entries where `user_id == self` |
| PM | Read entries for squad members |
| HRM | Read entries org-wide |
| tech_admin | Read all; can't delete |
| Audit role (separate, breakglass) | Read all + verify hash chain |

## Privacy

Audit entries can contain PII (skill name, IDs). On GDPR erase, replace `user_id`/`dev_id`/`by` with `"<erased>"` but keep the `action` history (regulatory necessity vs. erase tension).
