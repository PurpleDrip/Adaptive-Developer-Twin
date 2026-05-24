---
tags: []
---

# Design Anti-Patterns

## 1. Trusting the client for RBAC

Already covered: `X-User-Role` is client-set. This is the **canonical** anti-pattern for any product post-2010.

## 2. Service-owned secrets in env

Every service has its own `.env`. Rotation = restart 9 services. Concurrent secret distribution → race.

**Fix**: One secret source (Vault); services fetch on startup. Rotation triggers rolling restart.

## 3. Data Explorer as a feature

Building a Mongo CRUD UI for tech admins seems convenient. In practice it's a **backdoor** that bypasses every domain invariant. Two specific harms:

- It lets a tech admin write inconsistent state (e.g., update `users.role` without updating THG)
- It's auditable but not gated — any tech admin can mess with anything

**Fix**: Replace with **domain-specific admin endpoints**. "Unlock extension" should be a dedicated `/admin/extension/unlock` with its own validation, not a generic `update_document_field`.

## 4. Synchronous background tasks inside `BackgroundTasks`

FastAPI's `BackgroundTasks` is in-process. If the pod dies before the task finishes, it's gone. The "analyze every github_url" background is **lossy by design**.

**Fix**: Real job queue (Celery / RQ / Dramatiq) for anything that must complete.

## 5. Multiple Pydantic v1 / v2 patterns mixed

Suggests a half-done migration. Pick one and commit.

## 6. Gateway as a dumb proxy

The gateway has no auth, no caching, no shaping — just a routing table. We could remove it entirely without losing functionality. That suggests it's not earning its keep.

**Fix**: Either (a) push real responsibilities into the gateway (JWT verify, rate limit, cache, request shaping) or (b) replace with ingress + NGINX rules.

Today direction: (a). The gateway becomes a real API gateway, not just a proxy.

## 7. "10 pillars" marketing artifacts in technical names

`SCM-Audit`, `SWEF-Ingestion`, `BGSC-Feedback`, `VDA-Oversight`, `EVC-Influence` — these names are **marketing**. They make the technical conversation harder (every new engineer asks "what's SWEF stand for?"). Internally, prefer plain names; externally, keep the pillar names for the pitch.

**Fix**: Internal code uses `SlidingWindowAggregator` not `SWEF`. The pillar names live in [[01 - Overview/10 Pillar Algorithms]] and marketing materials.

## 8. THG-as-write-only-to-itself

THG service forbids anyone else writing to Neo4j directly — good. But Analytics service connects directly to Neo4j to read. That's inconsistent. Either read via THG too, or accept dual access pattern.

**Fix**: Decide and document. Reads via THG is cleaner but slower.

## 9. Sync flow in registration

`POST /register` does Mongo writes + THG call + background tasks **inline**. p99 latency = sum of all of them. A slow THG drags the register UX.

**Fix**: Mongo write only inline; THG and background analyses queued.

## 10. Pluralized resource paths inconsistent

`/users/{id}`, `/skills/{id}`, but also `/skill_update` and `/update-skill`. Pick a convention (kebab vs snake; singular vs plural) and apply.

**Fix**: REST style guide doc. Apply in v2 routes (don't break v1).

## 11. THG returns DTO with mutable field names

`SkillUpdateDTO {dev_id, skill_name, ...}` — `skill_name` instead of `name` because some other DTO has a different `name`. This kind of accreted naming is a smell.

**Fix**: Field-name dictionary. Same concept = same field name everywhere.

## 12. Sim Mode designed only as visualization, not as a guarantee

Sim Mode is a UI layer. The architecture (this vault now) explicitly elevates Sim Mode to a tenant-isolated, audit-tagged, env-flagged set of guarantees. The codebase doesn't yet enforce those guarantees.

**Fix**: Implement [[11 - Simulation Mode/Safe-Mode Guarantees]] in code. Don't ship Sim until those tests pass.

---

Each → [[13 - Yet to Implement/_MOC]].
