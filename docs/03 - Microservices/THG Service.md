---
tags: [service]
aliases: [THG, Talent Hiring Graph]
---

# THG Service

## Identity

| | |
|:---|:---|
| Port | `8004` → `8000` |
| Hostname | `thg-service` |
| Code | `backend/thg/` |
| Entry | `backend/thg/app/main.py` |
| Health | `GET /api/v1/thg/health` |

## Responsibilities

- **Sole writer to Neo4j** — every other service requests changes via this API
- Developer / Manager / Skill / Task nodes
- HAS_SKILL / MANAGES / ASSIGNED_TO / REQUIRES_SKILL edges
- Temporal decay applied at read time
- Influence ranking via PageRank (GDS) or [[07 - Algorithms/Native Cypher Fallback]]

## Routes

`prefix /api/v1/thg`

| Method | Path | Handler | Purpose |
|:-------|:-----|:--------|:--------|
| POST | `/create-dev` | `create_dev(DeveloperCreateDTO)` | MERGE Developer node |
| POST | `/create-manager` | `create_manager(DeveloperCreateDTO)` | MERGE Manager node |
| POST | `/link-manager-dev` | `link_manager_dev(ManagerLinkDTO)` | MERGE MANAGES edge |
| POST | `/update` | `update_skill(SkillUpdateDTO)` | Blend + decay skill strength |
| POST | `/update-skill` | `update_skill_delta({dev_id, skill_name, delta})` | Direct delta (assessments) |
| GET | `/skills/{dev_id}` | `get_developer_skills(dev_id)` | Live-decayed view |
| POST | `/match` | `match_task(TaskMatchDTO)` | Top 5 candidates for a task |
| GET | `/leaderboard/{skill_name}` | `get_leaderboard(skill_name)` | Top 10 by skill strength |
| GET | `/developers` | `get_all_developers()` | All devs + skills (for Allocation) |
| POST | `/record-assignment` | `record_assignment(AssignmentDTO)` | Idempotent ASSIGNED_TO edge |
| POST | `/task/create` | `create_task_in_graph(TaskCreateGraphDTO)` | Task node + REQUIRES_SKILL edges |
| GET | `/task/user/{dev_id}` | `get_user_tasks_from_graph(dev_id)` | Tasks ASSIGNED_TO this dev |
| GET | `/manager/{dev_id}` | `get_manager_for_dev(dev_id)` | Manager managing this dev |
| POST | `/generate-demo-data` | `generate_demo_graph()` | **DESTRUCTIVE** — wipes + seeds |
| GET | `/influence` | `get_influence_ranking()` | PageRank (or fallback) |

## Models / DTOs

Defined in `backend/thg/app/routers/thg.py` (should be moved to `shared/`):

- `SkillUpdateDTO {dev_id, skill_name, strength, confidence}`
- `SkillDTO {name, strength, confidence, updated}`
- `DeveloperSkills {dev_id, name, skills: [SkillDTO]}`
- `TaskMatchDTO {task_id, required_skills: {skill: weight}}`
- `ManagerLinkDTO {manager_id, dev_id}`
- `DeveloperCreateDTO {dev_id, name, bio?, gender?, primary_domain}`
- `MatchResult {task_id, candidates: [{dev_id, name, match_score}]}`
- `AssignmentDTO {dev_id, task_id}`
- `TaskCreateGraphDTO {task_id, title, description, required_skills: {skill: weight}}`

## Services / Business logic

### `app/services/neo4j.py`

- Driver init + close (lifespan-attached)
- `get_session()` FastAPI dependency

### Decay-on-read

```cypher
WITH r, duration.inDays(date(r.updated), date()).days AS days
SET r.live_strength = r.strength * exp(-0.1 * days)
```

> Strength stored is the *blended* value at write-time. The decay above is *computed on the fly* for read endpoints. This means a developer who hasn't been observed in 60 days will show progressively dimmer skills without any background job needing to run.

### Blend formula (write)

In `update_skill`:

```cypher
MERGE (d:Developer {id: $dev_id}), (s:Skill {name: $skill_name})
MERGE (d)-[r:HAS_SKILL]->(s)
ON CREATE
  SET r.strength = $strength,
      r.confidence = $confidence,
      r.updated = datetime(),
      r.prev_strength = $strength
ON MATCH
  WITH r, duration.inDays(date(r.updated), date()).days AS days
  SET r.strength = (r.strength * exp(-0.1 * days) + $strength) * 0.5,
      r.confidence = $confidence,
      r.updated = datetime(),
      r.prev_strength = r.strength
```

See [[07 - Algorithms/Temporal Decay Model]].

## Database

### Neo4j

| Node | Properties |
|:-----|:-----------|
| `Developer` | id, name, bio, gender, primary_domain, created_at |
| `Manager` | id, name, created_at |
| `Skill` | name |
| `Task` | id, title, description |

| Edge | Properties |
|:-----|:-----------|
| `HAS_SKILL` | strength, confidence, updated, prev_strength |
| `MANAGES` | assigned_at |
| `ASSIGNED_TO` | at |
| `REQUIRES_SKILL` | weight |

See [[06 - Data Models/Neo4j (THG) Schema]].

## Env vars

| Name | Purpose |
|:-----|:--------|
| `NEO4J_URI` | bolt+s://... |
| `NEO4J_USER`, `NEO4J_PASSWORD` | auth |

Loaded via `pydantic_settings.BaseSettings` in `app/config/settings.py`.

## Outbound calls

None. **THG is a leaf service.**

## Background tasks

None. Decay is computed on read.

## Known gaps

- **No write-locks** — concurrent `/update` calls on the same `(dev, skill)` race; last writer wins. Audit log captures both writes but the resulting strength may be off.
- **No GDS-availability detection** — `/influence` tries GDS then falls back. Currently no metric/alert if fallback is being used.
- **DTO duplication** — should live in `shared/`, not in the router file.
- **`/generate-demo-data` is destructive and unauthenticated** — must be gated behind `ENV != prod` or RBAC=tech. P0.
- **Cypher injection vector** — none today (parameterized everywhere), but the Data Explorer in Auth allows arbitrary Mongo updates that could indirectly corrupt THG via `dev_id` collisions. Audit needed.


---

## Testing

**Test location:** `backend/thg/test/`

### Unit tests (`pytest -m unit`)
- Schema validation for `SkillUpdateRequest` and graph node DTOs

### Integration tests (`pytest -m integration`)
- `test/integration/test_routes.py` — health, create-dev (valid + missing id), get-developers; Neo4j driver mocked

### Postman
**THG Service** folder — all 7 graph endpoints including negative cases.

### Known edge cases surfaced during testing
- `update-skill` does not enforce `strength <= 1.0` at the schema layer — a buggy caller could write `strength = 1.5` to the graph
- `match-task` returns empty list for an unknown `task_id` instead of 404 — consumers cannot distinguish "task doesn't exist" from "task exists but no matches"
