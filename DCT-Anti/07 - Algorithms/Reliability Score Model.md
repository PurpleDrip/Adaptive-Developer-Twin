---
tags: [algorithm]
---

# Reliability Score Model

> Per-batch "is this telemetry human?" score in [0, 1]. Below the threshold, fusion writes a `fraud_flag` and skips THG updates for that batch.

## Inputs (per batch's aggregated signals)

| Signal | What it measures |
|:-------|:-----------------|
| `keystroke_padding` | Variance of inter-keystroke intervals. Bots produce uniform timing; humans produce log-normal-ish |
| `human_jitter` | WPM variance across the window. Bots are flat; humans burst-pause-burst |
| `snippet_variety` | Lexical diversity of `code_snippets`. Bots paste the same lines; humans iterate |
| `command_to_keystroke_ratio` | A real dev runs commands (save, format, navigate). A bot just types. |
| `idle_to_active_ratio` | A real dev has thinking gaps. Constant zero idle is suspicious. |
| `working_hours_alignment` | Is the activity inside the configured working window? Highly off-hours is a soft anomaly. |

## Composite score

```python
def reliability(signals: AggregatedSignals) -> float:
    factors = {
        "keystroke_padding":   anomaly.padding_check(signals.wpm_values),
        "human_jitter":        anomaly.jitter_check(signals.wpm_values),
        "snippet_variety":     diversity(signals.code_snippets),
        "command_ratio":       command_health(signals.total_keystrokes, signals.total_commands),
        "idle_balance":        idle_health(signals.total_idle_seconds, signals.record_count),
        "hours_alignment":     hours_check(signals.window_start),
    }
    # Weighted geometric mean — penalizes the worst signal
    weights = {"keystroke_padding": 1.0, "human_jitter": 1.0, "snippet_variety": 0.7,
               "command_ratio": 0.7, "idle_balance": 0.5, "hours_alignment": 0.3}
    score = exp(sum(w * log(max(f, 0.01)) for f, w in zip(factors.values(), weights.values()))
                / sum(weights.values()))
    return clip(score, 0.0, 1.0)
```

The **geometric mean** weights low values heavily — one very bad signal drags the whole score down. We prefer false-negative (flag a real human) over false-positive (give a bot a pass).

## Threshold

Default `reliability_threshold = 0.5`. Configurable in `system_config.fraud_threshold`.

| Score range | Interpretation | Effect |
|:------------|:---------------|:-------|
| 0.85–1.00 | Clear human | Normal flow |
| 0.60–0.84 | Likely human; minor anomalies | Normal flow, confidence damped 0.9× |
| 0.50–0.59 | Borderline | Normal flow, confidence damped 0.7× |
| 0.20–0.49 | Suspicious | `fraud_flag: true`; THG writes skipped; audit log |
| 0.00–0.19 | Clearly bot/fraud | Same as above + alert tech admin |

## Output

```json
{
  "is_reliable": true,
  "reliability_score": 0.84,
  "factors": {
    "keystroke_padding": 0.92,
    "human_jitter": 0.87,
    "snippet_variety": 0.81,
    "command_ratio": 0.79,
    "idle_balance": 0.72,
    "hours_alignment": 0.95
  },
  "model_version": "rel-v1.0"
}
```

Stored in the batch's `fusion_result.reliability_check`.

## Code location

- `backend/fusion/app/services/anomaly_detector.py :: AnomalyDetector` — **stub**
- `backend/fusion/app/services/ai_core.py` references `anomaly.analyze_batch` and `anomaly.check_human_jitter`

Implement these stubs to ship the model. [[13 - Yet to Implement/Backend - Fusion - Anomaly Detector]].

## Calibration

The thresholds and weights above are **prior values**. They MUST be calibrated against labeled data:

1. Capture known-human batches (from trusted devs)
2. Capture known-bot batches (synthetic, from `data_synthesizer.py`)
3. Tune weights to maximize ROC-AUC at the chosen threshold

Tracked: [[13 - Yet to Implement/Backend - Fusion - Reliability Calibration]].

## Privacy note

The reliability factors **don't carry PII** — they're aggregate statistics. Safe to surface in audit logs and dashboards.
