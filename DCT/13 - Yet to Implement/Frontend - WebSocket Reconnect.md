---
tags: [yet-to-implement, p1, frontend, reliability]
status: pending
priority: P1
estimate: 1 day
---

# Frontend — WebSocket Reconnect

## Why
Live Audit HUD WS has no reconnect logic. A momentary network blip leaves the HUD blank until tab refresh.

## Acceptance criteria
- [ ] `useAuditStream` hook (skeleton in [[05 - Frontends/State & API Client]])
- [ ] Exponential backoff (1s → 2s → 4s → 8s, max 30s)
- [ ] On reconnect: backfill via `/audit-log?since=<last_seen_ts>`
- [ ] UI shows "reconnecting" pill
- [ ] Tests: kill WS server; verify reconnect within 30s

## Files involved
- `frontend-nextjs/src/lib/hooks/useAuditStream.ts` (new)
- `frontend-nextjs/src/components/tech/LiveAuditHUD.tsx`

## Tracked from
[[02 - System Architecture/Sequence - Live Audit HUD#Reconnect handling]]
