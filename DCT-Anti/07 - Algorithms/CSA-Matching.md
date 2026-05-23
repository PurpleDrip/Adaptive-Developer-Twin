---
tags: [algorithm]
aliases: [CSA, Cosine Matching, Pillar 7]
---

# CSA-Matching (Pillar #7)

> "Cosine Skill Affinity" — vector-space matching of developers to tasks.

## What we vectorize

### Task vector

`{ required_skills: { backend: 0.8, db: 0.4, security: 0.2 } }` → vector in skill space.

We use `analyze-text(title + description)` from Fusion as an **augmentation**, not a replacement — the explicit `required_skills` is the canonical input. The semantic vector handles the "the PM forgot to mark `security`" case.

### Developer vector

Per-dev: `{ skill: strength * confidence }` over all 8 axes, with decay applied.

## Match math

```python
def calculate_match(task_vec: dict, dev_vec: dict) -> float:
    all_skills = task_vec.keys() | dev_vec.keys()
    t = np.array([task_vec.get(s, 0) for s in all_skills])
    d = np.array([dev_vec.get(s, 0) for s in all_skills])
    norm_t, norm_d = np.linalg.norm(t), np.linalg.norm(d)
    if norm_t == 0 or norm_d == 0:
        return 0.0
    return float(np.dot(t, d) / (norm_t * norm_d))
```

Returns 0..1 (cosine similarity in non-negative space).

## Scoring formula

The match score isn't just cosine — it's blended with confidence and a baseline:

```
score = 0.6 * match
      + 0.2 * mean_confidence(dev_skills)
      + 0.2 * (1.0 if any_dev_skill > 0 else 0.0)
```

| Term | Purpose |
|:-----|:--------|
| `0.6 * match` | Skill-space fit (the bulk of the signal) |
| `0.2 * confidence` | Don't recommend a dev whose scores are noisy |
| `0.2 * baseline` | Tie-breaker: prefers a dev with any signal over none |

Weights are configurable (planned — currently hardcoded in `allocation/app/routers/allocation.py`).

## Hungarian for many-to-many

For batch allocation (`POST /optimize`), we build an `N_tasks × M_devs` match matrix and run `scipy.optimize.linear_sum_assignment` to find the **globally optimal** assignment that maximizes total match.

Naive greedy is O(N²): "for each task, take the best free dev." But greedy can leave the optimal global assignment on the table when the best-for-task-1 dev is also best-for-task-3.

Hungarian is O(N³) — still fast enough for ≤500 tasks × ≤500 devs in a single solve. Beyond that, fall back to greedy + local-swap refinement.

> ⚠️ Currently `WorkloadOptimizer.optimize_assignments` is **stub.** See [[03 - Microservices/Allocation Service#Known gaps]].

## XAI rationale

For top 3 candidates, we ask SHAP for an explanation:

```
"Why dev_alice for task-1023?"
  primary_driver  : backend (0.82 strength × 0.8 required = 0.66 contribution)
  secondary_driver: database (0.55 × 0.4 = 0.22)
  reasoning       : "Strong backend signal aligns with the task's primary requirement..."
```

See [[SHAP Explainability]].

## What CSA does NOT do

- **No fit-by-history** — doesn't know if alice has done this kind of task before
- **No team chemistry** — doesn't model who-works-well-with-whom
- **No timezone / availability** — doesn't check whether alice is on vacation

Each is tracked as P2 enhancements. Today, CSA is **skill fit only.**
