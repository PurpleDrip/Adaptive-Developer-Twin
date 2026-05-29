---
tags: [algorithm]
---

# SHAP Explainability

> Attribution analysis: **why did this score move?**

## The job

For every skill update, surface a human-readable rationale:

```
Backend skill rose from 0.78 → 0.82 because:
  primary_driver  : telemetry (0.6 contribution)
  secondary_driver: semantic snippets (0.3 contribution)
  reliability_check: 0.94 (no fraud flag)
```

Without this, every score change is a black box — fatal for a trust-claiming product.

## SHAP (Shapley values)

Game-theoretic attribution: for each input feature (telemetry signal, semantic vector, project evidence), compute its **marginal contribution** to the final score, averaged over all orderings of inclusion.

For our small (3–4 source) case, this is tractable in closed form:

```python
def shapley(sources: dict[str, float], total: float) -> dict[str, float]:
    contributions = {}
    n = len(sources)
    for src, val in sources.items():
        # marginal contribution = val / sum(vals) * total  (simplified)
        contributions[src] = val / sum(sources.values()) * total
    return contributions
```

(For true SHAP across many features, use the `shap` Python package.)

## Output shape

```json
{
  "skill": "backend",
  "delta": 0.04,
  "primary_driver": "telemetry",
  "impact": 0.62,
  "secondary_driver": "semantic",
  "contributions": {
    "telemetry": 0.62,
    "semantic": 0.31,
    "project_baseline": 0.05,
    "reliability_penalty": 0.02
  },
  "reasoning": "Strong telemetry signal during this window aligned with the dev's established backend baseline."
}
```

The `reasoning` string is templated, not LLM-generated. Templates per `(primary, secondary)` pair to keep output deterministic and safe.

## Where it lives

`backend/fusion/app/services/ai_core.py :: SHAPExplainer` — partially implemented (interface exists).

Used in:

- `/{user_id}/run` per skill in the response
- `/allocation/rank` for top-3 candidate rationale
- (planned) `/dashboard` "what changed today" surface
- (planned) `/project-manager/squad/{dev_id}` history view

## Templates per driver pair

```
("telemetry", "semantic")       → "Strong typing activity + code that semantically aligns with this skill."
("semantic", "telemetry")       → "Code substance was the primary driver; activity volume supports."
("project_baseline", *)         → "Baseline from project analysis dominated; current batch added context."
("reliability_penalty", *)      → "Score moved less than evidence would suggest due to low reliability signal."
```

## Why not just say "score moved 0.04"?

Trust. Auditability. Recourse. When a dev sees their score drop, they need to know:

- Was it telemetry (am I being measured fairly?)
- Was it semantic (was a low-confidence code-genre detection?)
- Was it fraud-flagged (is the system accusing me of something?)

Without SHAP, every dispute becomes a complaint with no evidence. With it, every dispute is a conversation against shared facts.

## Caveats

- SHAP is **not** causal. It says "this source contributed X to the final number." It doesn't say "you'd score Y if you increased Z."
- The order of contributions can be unintuitive when sources are correlated.
- Don't surface raw contribution numbers to non-technical users — the templated reasoning is the public surface.
