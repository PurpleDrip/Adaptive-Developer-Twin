---
tags: [yet-to-implement, p1, compliance]
status: pending
priority: P1
estimate: 2 days
---

# Compliance — Audit Log Retention

## Why
Regulatory requirements (SOX, ISO27001) typically want 7 years of audit logs.

## Acceptance criteria
- [ ] Object-locked S3 bucket (write-once)
- [ ] Daily export job from Mongo
- [ ] Retrieval procedure documented
- [ ] Tested annually

## Files involved
- Same as [[Backend - Monitoring - Audit Retention Policy]] — pair these

## Tracked from
[[08 - Security & Compliance/Audit Logging#Retention]]
