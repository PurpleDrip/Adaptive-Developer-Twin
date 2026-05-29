---
tags: [reliability]
---

# Runbook — Fusion Engine Stuck

## Symptoms

- `batch_processor_lag_seconds` rising fast in Grafana
- Telemetry batches piling up in `status=pending`
- Fusion `/run` p99 latency > 5s
- OR Fusion 5xx rate elevated

## Step 1 — Confirm it's Fusion

```bash
curl -s http://fusion-service:8000/api/v1/fusion/health
# or via gateway
curl -s https://api.../api/v1/fusion/health
```

If unhealthy → mitigate. If healthy → maybe THG is slow downstream.

## Step 2 — Common causes

| Cause | Symptom | Fix |
|:------|:--------|:----|
| CodeBERT cold start | First N requests hang on model load | Warm-up endpoint ([[13 - Yet to Implement/Backend - Fusion - Model Warm-up]]); restart pod and ping `/health` to warm |
| Memory leak | RSS rising over hours | `kubectl rollout restart deploy/fusion-service`; investigate post-incident |
| Large snippet (>10 KB) → CodeBERT timeout | One slow request blocks the pod | Add request size cap in router |
| HF Hub down (download_model.py) | New pod fails to start | Mirror model to private registry ([[13 - Yet to Implement/Infra - HF Model Mirror]]) |
| THG slow | Fusion blocks on downstream write | See [[Runbook - DB Outage#Neo4j AuraDB]] |

## Step 3 — Scale or restart

```bash
# Restart (clears memory leak)
kubectl rollout restart deploy/fusion-service

# Scale (handle load)
kubectl scale deploy/fusion-service --replicas=10
```

For load-driven case: also raise BatchProcessor concurrency (it processes per-user, can parallelize):

```python
# In Telemetry batch_processor.py — use asyncio.gather
results = await asyncio.gather(*[process_user(u) for u in user_groups], return_exceptions=True)
```

Today: serial. Tracked: [[13 - Yet to Implement/Backend - Telemetry - Parallel Batch Users]].

## Step 4 — Drain backlog

Once Fusion is healthy:

1. BatchProcessor will catch up automatically (every tick processes up to 10 k records)
2. Watch `unprocessed_raw_count` drop
3. ETA: `unprocessed / 10_000 * BATCH_INTERVAL_MINUTES`

For 1 M backlog at 5-min ticks: 100 ticks × 5 min = ~8 hours. **Lift the 10 k limit during catch-up.**

## Step 5 — Don't let it happen again

Add an alert on `batch_processor_lag_seconds > 1800` (30 min). Triage before it becomes hours.

See [[Runbook - Batch Processor Drift]] for the lag-specific runbook.
