---
tags: [architecture]
---

# Data Flow — Task Allocation

```mermaid
sequenceDiagram
    autonumber
    actor PM as Project Manager
    participant FE as Web
    participant GW as Gateway
    participant TASK as Task · :8008
    participant AUTH as Auth
    participant ALC as Allocation
    participant FUS as Fusion
    participant THG as THG
    participant N as Neo4j

    PM->>FE: fills "Create Task" form
    FE->>GW: POST /task/match (squad-scoped preview)
    GW->>TASK: match_candidates
    TASK->>AUTH: GET /squad/{manager_id}
    AUTH-->>TASK: [dev_ids]
    TASK->>ALC: POST /rank {task_dto}
    ALC->>FUS: POST /analyze-text {title + description}
    FUS-->>ALC: vector
    ALC->>THG: GET /developers
    THG-->>ALC: [all devs + skills]
    ALC->>ALC: cosine match · score = 0.6 m + 0.2 conf + 0.2
    ALC-->>TASK: ranked candidates
    TASK->>TASK: filter to squad members
    TASK-->>FE: top N for preview

    PM->>FE: clicks "Create" with chosen dev
    FE->>GW: POST /task/create
    GW->>TASK: create_task
    TASK->>ALC: POST /rank (re-rank for record)
    TASK->>THG: POST /task/create
    THG->>N: MERGE (t:Task)-[:REQUIRES_SKILL]->(s:Skill)
    TASK->>THG: POST /record-assignment
    THG->>N: MATCH (d), (t) MERGE (d)-[:ASSIGNED_TO]->(t)
    TASK-->>FE: 201 {task_id, top_candidates}
```

## Why squad-scoping?

Cross-squad allocation is a manager-level decision, not algorithmic. The CSA-Matching engine sees the whole org but Task service filters to the requesting manager's squad to prevent accidental "borrowing" of devs from other teams.

For org-wide hiring or rebalancing, HRMs use a different surface (planned: `/api/v1/task/match-org-wide` — see [[13 - Yet to Implement/Backend - Task - Org-wide Matching]]).

## Scoring formula

```
score = 0.6 * cosine_match(task_vector, dev_skill_vector)
      + 0.2 * mean_confidence(dev_skills)
      + 0.2 * baseline (any-skill > 0.0)
```

See [[07 - Algorithms/CSA-Matching]] for derivation.

## Hungarian for `/optimize`

If a PM hands the system *N* tasks and wants all assigned at once, `/optimize` builds an `N × M` match matrix and solves the assignment problem with the Hungarian Algorithm. This is **globally** optimal vs. greedy per-task selection.

See [[07 - Algorithms/CSA-Matching#Hungarian]].

## BGSC guardrail

Once a task is assigned, completion runs through [[07 - Algorithms/BGSC Feedback]] — the skill delta is bounded and verified before THG mutation.

## What's missing

- **No "exclude developer X" capability** — a PM can't manually veto a candidate yet.
- **No skill-stretch flag** — assigning a 0.3-strength dev to a 0.9-required task is a stretch; we don't yet surface this. ([[13 - Yet to Implement/Backend - Task - Stretch Flag]])
- **No reassignment workflow** — once `ASSIGNED_TO`, reassigning requires a manual cypher write today.
