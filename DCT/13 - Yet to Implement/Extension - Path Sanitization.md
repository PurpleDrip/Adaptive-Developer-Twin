---
tags: [yet-to-implement, p1, privacy]
status: pending
priority: P1
estimate: 4 hours
---

# Extension — Path Sanitization

## Why
Absolute paths like `/Users/alice/work/customer-acme-secret/src/main.py` leak customer + folder info.

## Acceptance criteria
- [ ] Strip absolute → repo-relative paths client-side
- [ ] Hash workspace root → opaque identifier in `active_file`
- [ ] Tests: `active_file` never contains `/Users/`, `/home/`, `C:\Users\`

## Files involved
- `extension/src/telemetry/collector.ts`

## Tracked from
[[08 - Security & Compliance/Code Snippet & Snapshot Safety#What about file paths]]
