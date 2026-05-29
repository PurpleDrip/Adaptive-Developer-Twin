---
tags: [simulation-mode]
---

# Safe-Mode Guarantees

> Hard contracts Sim Mode promises. Any change tagged `#simulation-mode` MUST honor these.

## 1. Sim never writes to prod

The mode flag selects:

- Sim DB cluster (separate Mongo, separate Neo4j, separate Redis prefix), OR
- A tenant ID `tenant=sim` enforced at every query (only if same physical cluster)

A bug in service code MUST NOT allow a sim event to mutate a real-tenant document.

## 2. Sim never bills

- No Stripe / payment integration runs in sim
- No emails are sent
- No outbound webhooks fire to customers

## 3. Real Mode never speeds up

The cadence multipliers (e.g., batch every 10 s instead of 5 min) are **only honored when `mode=sim`**. A `prod` service rejects any request asking for non-default cadence.

## 4. The dashboard always indicates mode

If a user is in sim env, *every screen* shows the banner from [[Mode Switcher Design#What the dev sees]]. Removing that banner is a P0 bug.

## 5. Sim Mode has its own audit log

`audit_logs` in sim are tagged `env: "sim"`. They never get rolled into prod analytics. If they're in the same Mongo cluster, the analytics queries always include `WHERE env != "sim"`.

## 6. Sim Mode uses synthetic identities

No real PII in sim. The Demo Driver script uses fictional names (Alice, Bob, Carol) drawn from a known list. Email addresses use `@example.com`.

## 7. Sim Mode is feature-flagged off in prod env by default

To enable Sim Mode in prod env (e.g., for a feature-flagged customer demo), a tech admin must explicitly toggle `feature.sim_mode_in_prod = true` AND `audit_logs` records the toggle.

## 8. No real customer telemetry ends up in sim

The Demo Driver does **not** read from `prod.telemetry_raw`. It generates its own from a fixture file (`scripts/demo_telemetry.jsonl`).

## 9. Sim Mode UI is visually distinct

The gradient border (see [[Color System#Sim Mode accent]]) is not a theme choice — it's a guardrail. A developer who notices "wait, why is the screen indigo-pink?" hopefully thinks twice before assuming the data is real.

## 10. There is a kill switch

`POST /admin/sim/kill` immediately:

- Pauses the Demo Driver
- Reverts the UI banner to red "Sim halted — page in safe state"
- Audits the action

For the moment when something on stage goes sideways.

## Verification

A CI test asserts each of these:

- `sim` requests with `tenant=prod` get 403
- Real Mode rejects `?cadence_override=` params
- A sim request that somehow touches a `users` collection (not `users_sim`) triggers a hard fail in test

Tracked: [[13 - Yet to Implement/Simulation - Safe Mode Tests]].
