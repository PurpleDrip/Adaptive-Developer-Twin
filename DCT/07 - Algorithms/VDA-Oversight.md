---
tags: [algorithm]
aliases: [VDA, Burnout Predictor, Pillar 8]
---

# VDA-Oversight (Pillar #8)

> "Velocity Decay Analytics" — a regression model predicting **burnout** and **velocity decay** before they happen.

> Status: **design intent.** Implementation is stubbed in `backend/analytics/app/services/burnout_predictor.py`. Tracked: [[13 - Yet to Implement/Backend - Analytics - Implement VDA]].

## The intuition

A burning-out developer doesn't suddenly stop coding. They:

1. Spend more time idle within working hours
2. Make smaller, more error-prone changes
3. Touch fewer files (avoiding context-switch cost)
4. Commit less often
5. Their typing variance drops (less playful exploration, more grinding)

VDA looks for **these trends** over a rolling window (e.g., 14 days) and projects forward.

## Inputs

Per developer, per day, from `telemetry_batches`:

| Feature | Source |
|:--------|:-------|
| `daily_idle_seconds` | sum(total_idle_seconds) per day |
| `daily_keystrokes` | sum(total_keystrokes) |
| `daily_errors_ratio` | total_errors / (total_errors + total_errors_fixed + 1) |
| `daily_commits` | sum(total_commits) |
| `daily_unique_files` | size(top_files) |
| `wpm_variance` | std(wpm_values) |
| `working_hours_density` | active_seconds / total_seconds_in_window |

## Model

A **linear regression** with engineered features, trained on labeled burnout events (manager-reported, post-hoc). Outputs:

```json
{
  "user_id": "uuid",
  "burnout_score": 0.34,        // 0..1, higher = more concerning
  "velocity_decay_score": 0.21, // 0..1, higher = more decay
  "horizon_days": 14,           // these scores project this far forward
  "drivers": {                  // SHAP-style attribution
    "idle_trend": 0.12,
    "commits_drop": 0.09,
    "errors_up": 0.07,
    "wpm_variance_down": 0.06
  },
  "confidence": 0.62
}
```

## Why linear (not deep)?

- **Explainability** — managers see *why* a score is high; deep models obscure that.
- **Sample efficiency** — burnout events are rare and self-reported. Linear handles small data well.
- **Stability** — a black-box model that flags burnout incorrectly is worse than no model.

When we have 10k+ labeled events, revisit (LSTM on the time series).

## Privacy / ethics

VDA must show its score **to the developer first**. Manager-side surfacing requires:

1. Developer opt-in (per-org policy)
2. Aggregated only — never single-dev scores in a dashboard without the dev's awareness
3. Always paired with **context**, not just a number

See [[08 - Security & Compliance/Telemetry Consent & Ethics]].

## Output surface

| Audience | What they see |
|:---------|:--------------|
| Developer (self) | Full score + drivers + suggestions |
| Manager (with consent) | Score + drivers, no raw telemetry |
| HRM (aggregated) | Squad-level histogram, no names |

## Caveats

- VDA is a **suggestion**, never an **action**. Reading "burnout score 0.7" is not authorization to lay someone off, transfer them, or surveil more.
- Working from a beach for a week (low keystrokes, high idle) **looks** like burnout to VDA. The score is not the truth.
- Cultural variation: code-by-day vs code-by-week patterns differ wildly. Calibrate per org.
