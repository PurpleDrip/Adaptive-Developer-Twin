---
tags: [dto]
aliases: [SkillUpdateDTO]
---

# DTO — Skill Update

The mutation that flows from Fusion → THG → Neo4j.

## Wire shape

```json
{
  "dev_id": "uuid",
  "skill_name": "backend",
  "strength": 0.82,
  "confidence": 0.91
}
```

## Variants

### `/update` — blend variant (default, from telemetry)

Decay + blend; see [[02 - System Architecture/Data Flow - Skill Update#Update math]].

### `/update-skill` — delta variant (from BGSC)

```json
{ "dev_id": "uuid", "skill_name": "backend", "delta": 0.05 }
```

Direct add (bounded 0..1). Used by assessments where the result is "trustworthy enough to skip blending."

## Validation

- `strength` ∈ [0.0, 1.0]
- `confidence` ∈ [0.0, 1.0]
- `skill_name` MUST be one of: `backend, frontend, devops, ml, neo4j, testing, database, security` (today)
- `dev_id` MUST resolve to an existing Developer node (404 if not)

## Why not free-form skill names?

A fixed enum prevents typo-sprawl (`back-end` vs `backend` vs `Backend`). When adding a new skill domain:

1. Add to the Fusion CodeBERT centroid set
2. Add to the THG validator
3. Add to the dashboard radar axes
4. Bump `engine_version`

Tracked: [[13 - Yet to Implement/Backend - All - Skill Enum Single Source]].
