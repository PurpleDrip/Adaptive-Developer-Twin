---
tags: [dto]
---

# DTO — Task

## TaskCreateDTO (wire — Task service)

```json
{
  "title": "string",
  "description": "string",
  "required_skills": { "backend": 0.8, "database": 0.4 },
  "created_by": "manager_id",
  "due_at": "ISO?",
  "priority": "low | normal | high?"
}
```

## TaskAssignDTO

```json
{ "dev_id": "uuid" }
```

## TaskReviewDTO

```json
{
  "task_id": "uuid",
  "status": "done | reviewed | cancelled",
  "review_notes": "string?",
  "skill_impact": { "backend": 0.04 }   // BGSC delta to apply
}
```

## TaskDocument (Mongo) — planned

See [[MongoDB Schema#tasks]].

## TaskCreateGraphDTO (THG)

```json
{
  "task_id": "uuid",
  "title": "string",
  "description": "string",
  "required_skills": { "backend": 0.8 }
}
```

Note: graph store gets the **structural** parts; Mongo gets the **mutable** parts (status, notes, timeline). Split intentional — Neo4j is bad at "edit this long text many times."
