---
tags: [algorithm]
---

# Temporal Decay Model

> "Skills are not forever." Without exercise, they fade. We model this as **exponential decay** applied on read.

## The formula

```
decayed_strength = strength * exp(-λ * days_since_update)
```

with `λ = 0.1` (default).

| days_since_update | factor |
|:------------------|:------:|
| 0 | 1.000 |
| 1 | 0.905 |
| 7 | 0.497 |
| 14 | 0.247 |
| 30 | 0.050 |

Half-life ≈ 7 days at `λ=0.1`. After ~30 days idle, strength is effectively zero.

## Why exponential?

| Model | Behavior |
|:------|:---------|
| **Linear** | `s - k*t` — sharp cliff at zero; doesn't match how skill actually fades |
| **Step** | "after N days, halve" — abrupt, harsh |
| **Exponential** | smooth, principled, half-life intuition aligns with how learning literature describes forgetting |

## Why `λ = 0.1`?

Empirical tuning. Justification:

- Skills you used 3 days ago feel ~70% as sharp → exp(-0.1*3) ≈ 0.74 ✓
- Skills you haven't touched in 2 weeks feel ~25% → exp(-0.1*14) ≈ 0.25 ✓
- A month without practice ≈ near-zero → exp(-0.1*30) ≈ 0.05 ✓

If a customer disagrees with this curve, λ should be **configurable** per skill (some skills decay faster than others — Kubernetes flag-syntax decays in days, "good design taste" decays in months). Tracked: [[13 - Yet to Implement/Backend - THG - Per-Skill Decay Rate]].

## Read-time vs write-time

We apply decay **at read** in queries:

```cypher
RETURN r.strength * exp(-0.1 * days_since(r.updated)) AS strength
```

This means:

- No background job needed — every read is current
- Storage is the raw write-time strength + `updated` timestamp
- Confidence is *not* decayed (confidence reflects *certainty of last estimate*, not freshness)

## Decay on blend

When a new write arrives:

```python
prior_decayed = old.strength * exp(-0.1 * days_since(old.updated))
new_strength = (prior_decayed + incoming_strength) * 0.5
```

This means the **stored** strength after a write reflects the freshly-decayed value blended with the new evidence. A dev returning after 2 weeks then doing one strong batch ends up around `(0.25 + 0.8) / 2 = 0.525` — not the full 0.8.

## Edge cases

- **Future `updated` timestamps** → days is negative → strength is amplified. Defensive clamp: `days = max(0, days)`.
- **`prev_strength` for change-detection** is set without decay (it's a snapshot). Reads always recompute from `strength`.
- **Read inside the same day as write** → `days = 0` → no decay. Correct.

## What this doesn't model

- **Active forgetting** — sometimes you actively unlearn (move from Python 2 to Python 3, the old habit is bad). We don't have signal for that.
- **Reinforcement learning curve** — the *next* time you re-touch a skill, you ramp back faster than the first time. We don't model "skill memory."
- **Negative evidence** — a bad PR using a skill we previously believed you were good at. We don't dock points; we'd just write a low-strength batch which pulls the score down. Sufficient.

## See also

- [[02 - System Architecture/Data Flow - Skill Update]] for the write-time formula
- [[06 - Data Models/Neo4j (THG) Schema#Decay-on-read]] for the Cypher
