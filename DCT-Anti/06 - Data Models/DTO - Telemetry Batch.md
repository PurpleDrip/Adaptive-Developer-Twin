---
tags: [dto, schema-mongo]
aliases: [TelemetryBatchDocument]
---

# DTO — Telemetry Batch

`shared/models/telemetry.py :: TelemetryBatchDocument`.

Produced by the [[03 - Microservices/Telemetry Service#BatchProcessor|BatchProcessor]] every `BATCH_INTERVAL_MINUTES`.

## Stored shape (Mongo)

```json
{
  "batch_id": "BATCH-202605241200-abcdef01",
  "user_id": "uuid",
  "window_start": "ISO",
  "window_end": "ISO",
  "record_count": 42,

  "aggregated_signals": {
    "avg_wpm": 38.5,
    "wpm_values": [42, 35, 0, 50, ...],
    "total_keystrokes": 1872,
    "total_commands": 47,
    "total_errors": 6,
    "total_errors_fixed": 4,
    "total_commits": 1,
    "total_idle_seconds": 220,
    "top_files": { "backend/auth/app/main.py": 540, "...": 120 },
    "language_distribution": { "python": 0.72, "yaml": 0.18, "json": 0.10 },
    "code_snippets": ["def foo():\n  ...", "..."],
    "total_copy_paste": 3
  },

  "fusion_result": { ... },     // see Fusion response shape
  "thg_updates": { "count": 5 },

  "status": "pending | completed | failed",
  "error": null | "string",
  "created_at": "ISO",
  "processed_at": "ISO"
}
```

## `batch_id` format

```
BATCH-{YYYYMMDDHHMM}-{user_id[:8]}
```

Examples:

- `BATCH-202605241200-abcdef01`
- `BATCH-202605241205-abcdef01`

Allows easy bucketing per-user per-window in queries.

## Aggregation rules

| Field | Source | Aggregation |
|:------|:-------|:-----------|
| `avg_wpm` | raw `wpm > 0` | arithmetic mean |
| `wpm_values` | raw `wpm > 0` | preserved as list |
| `total_keystrokes` | raw `keystrokes` | sum |
| `total_commands` | raw `commands_executed` | sum |
| `total_errors` | raw `errors_encountered` (when present) | sum |
| `total_errors_fixed` | raw `errors_fixed` (when present) | sum |
| `total_commits` | raw `commits` (when present) | sum |
| `total_idle_seconds` | raw `idle_seconds` | sum |
| `top_files` | raw `active_file` + window duration | merge → sort desc, cap 20 |
| `language_distribution` | raw `languages_used` | merge → normalize to 1.0 |
| `code_snippets` | raw `code_snippet` | preserve, cap 10 |
| `total_copy_paste` | raw `copy_paste_count` (when present) | sum |

## `fusion_result` shape

```json
{
  "status": "fusion_complete",
  "engine_version": "v2.0-top-tier",
  "reliability_check": {
    "is_reliable": true,
    "reliability_score": 0.94,
    "factors": {
      "keystroke_padding": 0.97,
      "human_jitter": 0.91,
      "snippet_variety": 0.88
    }
  },
  "skill_updates": {
    "backend":  { "strength": 0.82, "confidence": 0.91, "explanation": "..." },
    "frontend": { "strength": 0.45, "confidence": 0.78, "explanation": "..." }
  }
}
```

If `reliability_check.is_reliable == false`, each skill in `skill_updates` gets `fraud_flag: true` and **THG writes are skipped** for that batch.

## `status` lifecycle

```
pending → completed                   (fusion 201 + all THG updates 201)
pending → failed                      (fusion fail OR THG write fail)
```

`processed_at` is always set before insert, so it's never null in practice.

## Indexes

| Index | Purpose |
|:------|:--------|
| `batch_id` unique | Trace |
| `(user_id, window_start)` | Per-dev history |
| `status` | Drain failed batches |
