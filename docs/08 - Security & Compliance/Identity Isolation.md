---
tags: [security]
---

# Identity Isolation

> Three Mongo collections, one per role family: `users`, `managers`, `tech_staff`. A developer can never *become* a manager by mutation. Privilege escalation requires DB-level access.

## Why three collections (vs one with a `role` field)?

| One collection | Three collections |
|:---------------|:------------------|
| `UPDATE users SET role='tech_admin'` is a privilege escalation if the auth layer misses one check | Requires moving the doc to a different collection — operationally visible |
| Easier to enumerate users | Forces cross-collection joins (deliberate friction) |
| Cleaner schema | Slightly redundant fields |

We chose **three** because the cost of forgetting an RBAC check is catastrophic. The collection itself is part of the policy.

## Polymorphic lookup

When a username is given to `/login`, Auth queries the three collections in order:

```python
for coll in ("users", "managers", "tech_staff"):
    doc = await db[coll].find_one({"username": u})
    if doc and verify_password(p, doc["password_hash"]):
        return doc
raise HTTPException(401, "Invalid credentials")
```

The collection it found in **is** the role family. The `role` field within the doc further subdivides (e.g., `senior_manager` vs `hrm`).

## Cross-collection invariants

- **Username uniqueness across ALL three** — Mongo can't natively enforce this. Mitigation: a "directory" projection collection (`username_index`) with a unique constraint, written on every account creation. Tracked: [[13 - Yet to Implement/Backend - Auth - Username Cross-Collection Uniqueness]].
- **Email uniqueness across all three** — same.
- **Extension ID unique to `users`** — only devs have them; uniqueness within `users` is sufficient.

## Migration / role-changes

A real org sometimes needs to promote a developer to a manager. The flow:

1. Tech admin invokes (new) `POST /admin/promote-user {user_id, new_role}`
2. Auth reads from `users`, writes to `managers` with appropriate fields
3. Deletes from `users` (cascading: handle dev-specific resources)
4. Updates THG: `Developer` node becomes a `Manager` node (cypher `SET d:Manager REMOVE :Developer`)
5. Audit: `action: user_promoted`

> ⚠️ **Not implemented today.** Tracked: [[13 - Yet to Implement/Backend - Auth - Promote User Endpoint]].

## What this doesn't protect against

- A compromised `tech_admin` account
- Direct DB write access (only mitigated by least-privilege DB roles)
- A bug in the polymorphic lookup that prefers the wrong collection

## Compare: standard practice

Many products use a single `users` table with a `role` column. That's fine when role changes are common and audit-able. Our design favors **strong isolation** at the cost of more friction — appropriate for a product that **judges** its users.
