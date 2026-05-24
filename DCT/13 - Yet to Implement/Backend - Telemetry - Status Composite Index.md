---
tags: [yet-to-implement, p2, performance]
status: pending
priority: P2
estimate: 1 hour
---

# Backend — Telemetry — Status Composite Index

## Why
`GET /status/{ext_id}` counts unprocessed by `extension_id`. A composite `(extension_id, processed)` index makes this O(log n).

## Acceptance criteria
- [ ] Add to `shared/database/mongo.py:_ensure_indexes()`
- [ ] Document in [[06 - Data Models/Index Strategy]]

## Files involved
- `shared/database/mongo.py`

## Tracked from
[[06 - Data Models/Index Strategy#Indexes to add P1]]
