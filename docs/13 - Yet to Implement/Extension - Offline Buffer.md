---
tags: [yet-to-implement, p1, extension]
status: pending
priority: P1
estimate: 3 days
---

# Extension — Offline Buffer

## Why
If the gateway is unreachable, telemetry is **dropped**. Tier-1 says "zero data loss for accepted records." We need a local buffer.

## Acceptance criteria
- [ ] LevelDB / IndexedDB-like local store in extension's `globalStorageUri`
- [ ] Failed sends append to the buffer
- [ ] Background worker replays buffered pings on reconnect (oldest first, exponential backoff)
- [ ] Buffer capped at 1000 entries; oldest dropped beyond cap
- [ ] UI: status bar shows "buffered: N" when non-empty

## Files involved
- `extension/src/telemetry/buffer.ts` (new)
- `extension/src/telemetry/sender.ts`

## Tracked from
[[04 - VS Code Extension/Activation Flow#Known gaps]] · [[04 - VS Code Extension/Telemetry Sender#Known gaps]]
