---
tags: [yet-to-implement, p2]
status: pending
priority: P2
estimate: 1 day
---

# Extension — Hot Heartbeat Reload

## Why
`heartbeat_interval_seconds` change takes effect only on sender restart. Tech admin tuning should be near-realtime.

## Acceptance criteria
- [ ] Sender re-fetches `/system-config` every N minutes (or on a poke endpoint)
- [ ] When the value changes, gracefully reset the interval
- [ ] Tests: change config → sender adjusts within 1 min

## Files involved
- `extension/src/telemetry/sender.ts`

## Tracked from
[[04 - VS Code Extension/Telemetry Sender#Heartbeat interval is server-controlled]]
