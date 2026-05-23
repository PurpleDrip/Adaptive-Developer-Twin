---
tags: [algorithm]
---

# Bayesian Skill Fusion

> How telemetry + semantic + project-analysis combine into one number per skill. The mathematical heart of Fusion.

## The setup

For each (dev, skill) pair at fusion time, we have multiple evidence streams:

| Source | What it gives | Confidence |
|:-------|:--------------|:-----------|
| Telemetry (this batch) | a real number in [0, 1] | proportional to `reliability_score` |
| CodeBERT (snippets in this batch) | a real number in [0, 1] | proportional to snippet count |
| Project analysis (deep audit) | a real number in [0, 1] | initial baseline only |
| Prior strength (in THG) | a real number in [0, 1] | already established |

We want **posterior** strength + confidence, given all of these.

## Bayesian update

Model each skill score as **Beta(α, β)**. The mean is `α / (α + β)` — our strength. The variance shrinks with `α + β` — our confidence.

For each new piece of evidence with score `x` and confidence `c`:

```
α' = α + c * x * k
β' = β + c * (1 - x) * k
```

where `k` is the strength of the evidence (a few keystrokes → small `k`; a full project scan → large `k`).

After updating across all evidence:

```
posterior_strength = α' / (α' + β')
posterior_confidence = (α' + β') / ((α' + β') + scale)
```

(The `scale` controls how fast confidence grows with sample size.)

## Why Beta

- **Conjugate prior**: closed-form posterior, no MCMC needed
- **Naturally bounded** [0, 1]
- **Mean and variance decouple**: we get both strength and confidence "for free"

## The reliability discount

Before applying evidence to the Beta, multiply `c` (confidence) by the batch's `reliability_score`:

```
c_effective = c * reliability_score
```

If `reliability_score = 0.4` (sketchy batch), the evidence's effect is ⁴⁄₁₀ of nominal. If `reliability_score = 0.0` (clear fraud), the evidence has zero effect.

## Where this lives

`backend/fusion/app/services/bayesian_fusion.py :: BayesianFuser` — **currently a stub.**

Implementation must:

1. Load prior `(α, β)` from THG (via current `strength` and a derived `α + β` proxy)
2. For each source in this run, update `(α, β)`
3. Compute posterior strength + confidence
4. Pass to [[SHAP Explainability]] for the rationale
5. Return per-skill dict

Tracked: [[13 - Yet to Implement/Backend - Fusion - Real ML Pipeline]].

## Toy example

Prior: `α=4, β=6` → strength 0.4, confidence ~ 0.4 (sample size 10)

New telemetry: `x=0.8, c=0.7, k=3, reliability=0.9`:

```
c_eff = 0.7 * 0.9 = 0.63
α' = 4 + 0.63 * 0.8 * 3 = 5.5
β' = 6 + 0.63 * 0.2 * 3 = 6.38
posterior_strength = 5.5 / 11.88 = 0.46
posterior_confidence = 11.88 / (11.88 + 5) = 0.70
```

Strength moved 0.40 → 0.46 (modest); confidence moved 0.40 → 0.70 (significant). That's the desired behavior — one batch shouldn't dominate the score but should sharpen the certainty.

## What this prevents

Without Bayesian fusion:

- A single noisy batch could swing a skill 0 → 0.9
- Adding evidence wouldn't *increase confidence*, just replace the number
- Conflicting sources (telemetry says 0.8, project says 0.4) couldn't be reconciled principled

With it:

- Every update is sample-weighted
- Confidence is monotonically non-decreasing with evidence
- Sources can be added/removed without re-architecting the fuser

## Trade-off

- **Cold-start** is painful: a new developer has `α=0, β=0` and every evidence dominates. Mitigation: deep audit at registration writes meaningful priors.
- **Skill drift after long absence** isn't captured by Bayes alone — that's what the [[Temporal Decay Model]] does post-fusion.
