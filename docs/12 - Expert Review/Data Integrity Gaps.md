---
tags: [reliability, observability]
---

# Data Integrity Gaps

## 1. No idempotency on `/ingest`

Re-tries from the extension can double-write raw records. Batch aggregation then double-counts.

**Fix**: `Idempotency-Key` header + TTL'd Redis dedupe.

## 2. Batch ↔ Raw consistency

Failed batches can leave raw records:

- with `batch_id` set but `processed=false` (never marked)
- with `batch_id` set AND `processed=true` (the batch failed AFTER marking)

This depends on the exact order in `process_batches`. Should be: write batch doc (status=pending) → fusion → THG → mark raw processed → update batch (status=completed).

**Fix**: Two-phase commit / transaction. Either:

- Mongo multi-doc transaction
- Saga pattern with compensating actions
- Idempotent re-runs that detect the prior partial state

## 3. THG → Audit consistency

Telemetry calls THG `/update` then Mongo `audit_logs.insert`. If THG succeeds and Mongo write fails (or vice versa), state diverges.

**Fix**: Synchronous: THG returns 201 → write audit → if audit fails, **revert THG via compensating delta**. Or async: enqueue audit write; eventual consistency.

## 4. Skill update race

Two batches for the same user finish at the same time. Both call `/update` for `backend`. Last writer wins via MERGE — but the audit log shows two events; the resulting strength may not match either single update.

**Fix**: Either:

- Per-(user, skill) advisory lock during the blend op
- Serialize updates per user via a queue
- Accept "near-misses" since the audit log captures both writes

For now we accept — but **document**.

## 5. `prev_strength` is always overwritten

In `update_skill` ON MATCH:

```cypher
SET r.prev_strength = r.strength
```

This sets prev_strength to the **already-decayed** stored value. If we want "previous as-of-last-write," we should set prev_strength BEFORE applying decay+blend.

**Fix**: Stash old strength in a Cypher variable before the SET, then assign as prev_strength.

## 6. Audit `before`/`after` may not match THG

If the THG write decays + blends, the resulting `r.strength` differs from what we put in `details.after`. The audit shows the requested update, not the realized state.

**Fix**: Audit captures the THG return value, not the request. Add `realized` field in audit entry.

## 7. No constraint between users/managers/tech_staff usernames

Mongo can't enforce cross-collection uniqueness. A username collision across silos could silently overwrite via the polymorphic lookup (first-match-wins).

**Fix**: `username_index` collection with a unique index, written on every account creation. Auth's create flows do this in a transaction.

## 8. Extension lock doesn't actually verify HW hash

`hardware_lock` accepts whatever `machine_id` the client sends. The first one wins. There's no proof the client actually computed `vscode.env.machineId`.

**Fix**: This is fundamental — clients always claim, we just trust. Mitigations:

- Multiple HW factors (machine_id + node-machine-id + CPU UUID) → harder to fake all
- Server-side anomaly detection across HW factors
- Re-confirmation pings periodically

## 9. No "audit log integrity check" job

If audit_logs is silently corrupted (collection drop, doc delete), we don't notice for weeks.

**Fix**: Hash chain ([[08 - Security & Compliance/Audit Logging#Tamper detection P1]]) + daily verification job that walks the chain.

## 10. Mongo and Neo4j drift

`users` exists in Mongo with `user_id`; `Developer` node should exist in Neo4j with same `id`. If THG `/create-dev` fails after Mongo insert, Mongo has a "ghost" user with no graph node.

**Fix**: Saga: insert Mongo → call THG → on failure, retry → on permanent failure, mark user `is_ghost=true` and emit alert.

---

Each → [[13 - Yet to Implement/_MOC]].
