---
tags: [yet-to-implement, p1, simulation-mode, security]
status: pending
priority: P1
estimate: 2 days
---

# Simulation — Safe Mode Tests

## Why
Sim Mode's [[11 - Simulation Mode/Safe-Mode Guarantees]] must be **provable**, not just documented.

## Acceptance criteria
- [ ] Test: sim request with `tenant=prod` returns 403
- [ ] Test: prod env rejects `mode=sim` header
- [ ] Test: sim request that touches a non-`_sim` collection name → hard fail
- [ ] Test: sim banner present on every sim page
- [ ] Test: audit entries from sim env have `env: "sim"`
- [ ] Run in CI gating any change tagged `#simulation-mode`

## Files involved
- `tests/integration/sim/safe_mode_test.py` (new)

## Tracked from
[[11 - Simulation Mode/Safe-Mode Guarantees#Verification]]
