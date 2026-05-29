---
tags: [service, algorithm]
aliases: [Allocation, Allocation Engine]
---

# Allocation Service

## Identity

| | |
|:---|:---|
| Port | `8005` → `8000` |
| Hostname | `allocation-engine` |
| Code | `backend/allocation/` |
| Entry | `backend/allocation/app/main.py` |
| Health | `GET /api/v1/allocation/health` |

## Responsibilities

- **Vectorize tasks** via Fusion `/analyze-text`
- **Rank developers** via cosine similarity (CSA-Matching)
- **Optimize many-tasks-to-many-devs** assignments via Hungarian Algorithm
- **Record-only assignment** (`/select`) — delegates persistence to THG

Allocation is **read-only** from THG's perspective; it doesn't write to Neo4j. The Task service handles persistence.

## Routes

| Method | Path | Handler | Purpose |
|:-------|:-----|:--------|:--------|
| POST | `/rank` | `rank_devs(TaskAllocationRequest)` | Score every dev against one task |
| POST | `/optimize` | `optimize_allocations([TaskAllocationRequest])` | Hungarian solve for N tasks × M devs |
| POST | `/select` | `select_dev(user_id, task_id)` | Confirms assignment by calling THG |

## Models / DTOs

- `TaskAllocationRequest {task_id?, title, description, required_skills: {skill: weight}, min_confidence: 0.3}`

## Services / Business logic

### `SkillMatcher` (`app/services/skill_matcher.py`)

- `calculate_match(task_vector, dev_skills) → float` — cosine similarity of the dev's skill vector to the task's required skill vector.
- `get_task_vector(task_desc)` async — calls Fusion `/analyze-text`; falls back to a keyword heuristic on failure.

### Scoring composition

In `rank_devs`:

```python
score = 0.6 * match + 0.2 * confidence + 0.2 * 1.0  # baseline if any skill > 0
```

After scoring all devs:

1. Filter `confidence >= min_confidence`
2. Sort by `score` desc
3. Take top N (default 5? — verify in code)
4. Build XAI rationale for top 3 via SHAP from Fusion

### `WorkloadOptimizer` (`app/services/workload_optimizer.py`)

Hungarian Algorithm via `scipy.optimize.linear_sum_assignment` on a `tasks × devs` match matrix.

> ⚠️ Currently a stub — see Known gaps.

### `Recommender` (`app/services/recommender.py`)

Stub. Intended for: "you might like dev X for task Y because they recently grew skill Z."

## Database

None. Stateless.

## Env vars

| Name | Purpose |
|:-----|:--------|
| `THG_URL` | candidate pool |
| `FUSION_URL` | text vectorization |

## Outbound calls

| To | Endpoint | When |
|:---|:---------|:-----|
| Fusion | `POST /analyze-text` | every `/rank` |
| THG | `GET /developers` | every `/rank` and `/optimize` |
| THG | `POST /record-assignment` | `/select` |

## Background tasks

None.

## Known gaps

- **`WorkloadOptimizer.optimize_assignments` not implemented** — `/optimize` returns 500 today
- **Recommender stub** — no proactive task suggestions
- **No caching of `/developers`** — every `/rank` re-fetches the full dev list from THG. For 10k devs this is the bottleneck. Add 30 s LRU cache in-process. ([[13 - Yet to Implement/Backend - Allocation - Dev Cache]])
- **No stretch-flag** — see [[02 - System Architecture/Data Flow - Task Allocation#What's missing]]
- **No exclusion list** — manager can't veto a candidate per call


---

## Testing

**Test location:** `backend/allocation/test/`

### Algorithm tests (`pytest -m algorithm`)
- `test/unit/test_skill_matcher.py` — cosine similarity: identical (->1.0), orthogonal (->0.0), empty (->0.0), partial overlap
- `test/unit/test_workload_optimizer.py` — Hungarian algorithm: perfect match, below-threshold skip (< 0.2), empty matrix

### Integration tests (`pytest -m integration`)
- `test/integration/test_routes.py` — rank endpoint with valid task description, empty body (422)

### Known edge cases surfaced during testing
- `SkillMatcher.get_task_vector` falls back to keyword heuristic if Fusion is down — heuristic produces sparse binary vectors, degrading match quality silently
- `WorkloadOptimizer` threshold is 0.2 (hard-coded) — any task-developer pair below this is never assigned, even if it's the best available match
