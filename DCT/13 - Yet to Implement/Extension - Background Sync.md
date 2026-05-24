---
tags: [yet-to-implement, p2]
status: pending
priority: P2
estimate: 2 days
---

# Extension — Background Sync

## Why
Extension runs only when VS Code is open. Periodic background sync from local buffer (via OS-level scheduler) makes coverage tighter.

## Acceptance criteria
- [ ] On platforms that support it (macOS launchd, Windows Task Scheduler, systemd user), register a small helper to drain the buffer
- [ ] Otherwise no-op (still works when VS Code is open)
- [ ] Tests: closes VS Code with buffered pings → reopens → pings drain

## Files involved
- `extension/src/telemetry/background-sync.ts` (new)

## Tracked from
[[04 - VS Code Extension/Activation Flow#Known gaps]]
