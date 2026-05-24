---
tags: [security]
---

# Hardware Anchoring (security lens)

The algorithm is in [[07 - Algorithms/SHA-HWID Anchor]]. This page is the **security posture** angle.

## What it buys us

- Telemetry from a given `extension_id` provably originates from one specific machine
- Account-sharing attacks (the most common cheat) become physically detectable
- Audit logs can attribute every action to "this dev, on this machine, at this time"

## What it doesn't buy

- **Trust in the machine itself.** If a dev installs a key-injection script on their own machine, the telemetry is still from "their machine" — just not from their hands.
- **VM cloning resistance.** `vscode.env.machineId` may survive VM cloning. P2 mitigation: bind to native HWID via `node-machine-id` ([[13 - Yet to Implement/Extension - Native HWID]]).

## Layered defenses (the actual story)

| Layer | What it catches | Cost |
|:------|:----------------|:-----|
| Hardware lock | Account sharing | Low |
| [[07 - Algorithms/Anomaly Detection\|Server anomaly detection]] | Bot scripts on the locked machine | Medium |
| Long-term consistency check | Skill profile suddenly diverges from history | High (needs labeled data) |
| Manager-in-the-loop | Everything else | High (process) |

The hardware anchor is necessary but **not** sufficient.

## Threat scenarios

### Scenario 1: "I want to game my score"

- Dev runs a script that types stuff
- Script runs on **their** machine → passes hardware lock
- Anomaly detector flags constant keystroke timing → `fraud_flag: true` → manager sees in HUD → conversation happens

### Scenario 2: "I want to pretend my colleague's bad code is mine"

- Dev copies colleague's code into their own machine
- Telemetry says "this dev wrote this code" — correctly attributed *by machine*
- Semantic analyzer flags suddenly-mature code that doesn't match dev's history → drift detection ([[13 - Yet to Implement/Backend - Fusion - Drift Detection]]) flags it

### Scenario 3: "I want to disable telemetry while still working"

- Dev quits VS Code, opens a different editor
- We see a gap in pings → SHEC handshake on next start says "mismatch" → INITIAL re-sync
- Audit log shows the gap and the resync
- Manager sees consistent gaps → conversation

### Scenario 4: "I want to escape the system entirely"

- Dev uninstalls extension → no data flows
- Server eventually marks dev as `inactive` after N days of no pings
- This is **fine** — we don't claim coverage of devs who opt out at the OS level. The org's policy decides whether opting out is acceptable.

## See also

- [[Telemetry Consent & Ethics]] — the ethics of all of the above
- [[07 - Algorithms/SHA-HWID Anchor]] — algorithm details
