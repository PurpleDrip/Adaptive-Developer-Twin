---
tags: [security]
---

# RBAC Matrix

## Roles

- `developer` (users collection)
- `project_manager` / `senior_manager` / `hrm` (managers collection)
- `tech_admin` / `tech_support` (tech_staff collection)
- `service` (machine — for service-to-service)

## Capability matrix (target)

| Capability | dev | PM | sr_mgr | hrm | tech_admin | tech_support | service |
|:-----------|:---:|:--:|:------:|:---:|:----------:|:------------:|:-------:|
| Read own profile | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | – |
| Read own skills | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | – |
| Read squad skills | – | ✓ (own) | ✓ (all) | ✓ (all) | ✓ | view-only | – |
| Read any user's skills | – | – | – | ✓ | ✓ | view-only | – |
| Create task | – | ✓ | ✓ | ✓ | – | – | – |
| Assign task | – | ✓ | ✓ | ✓ | – | – | – |
| Issue assessment | – | ✓ | ✓ | ✓ | – | – | – |
| Reset hardware lock | – | – | – | – | ✓ | – | – |
| Edit system config | – | – | – | – | ✓ | – | – |
| Read audit log | – | own | own + reports | all | all | view-only | – |
| Mongo Data Explorer | – | – | – | – | ✓ | – | – |
| Cross-service write | – | – | – | – | – | – | ✓ |

## Enforcement layers

1. **Gateway** — verifies JWT, extracts role, signs and forwards in `X-User-Role` (gateway-set, not client-set)
2. **Service** — `role_required` dependency checks the (now trusted) header
3. **Data layer** — Mongo role grants narrowest necessary perms (e.g., `audit_logs` service-role is insert-only)

## Current gap

Layer 1 is **missing**. The gateway today forwards client-supplied `X-User-Role` blindly. Until [[Auth & Sessions]] is implemented, RBAC is **decorative**, not enforced.

Tracked: [[13 - Yet to Implement/Backend - All - RBAC Signed]].

## Squad scoping

For PMs, "squad" = developers MANAGES-linked to this manager in THG. Every PM-scoped endpoint:

1. Resolves squad: `GET /api/v1/auth/users/squad/{manager_id}`
2. Filters the result to only IDs in the squad

This makes "see another PM's squad" impossible at the API level. PMs of PMs (senior managers) get a wider scope by traversing `MANAGES` twice.
