---
tags: [yet-to-implement, p2, security]
status: pending
priority: P2
estimate: 2 days
---

# Extension — Native HWID

## Why
`vscode.env.machineId` survives VM cloning. For extra-strong mode, bind to native HW UUID via `node-machine-id`.

## Acceptance criteria
- [ ] On hardware-lock: send both `vscode.env.machineId` AND `node-machine-id` result
- [ ] Server stores both; requires both to match on subsequent ingests
- [ ] Tech admin can choose strict (both required) or lax (either) per org

## Files involved
- `extension/src/extension.ts`
- `backend/auth/app/routers/users.py`

## Tracked from
[[07 - Algorithms/SHA-HWID Anchor#Threats it does NOT defeat]]
