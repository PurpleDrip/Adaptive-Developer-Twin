---
tags: [observability]
---

# Observability Gaps

## 1. No structured logs

`print()` and bare `logging.info(...)` produce free-form text. Can't filter, can't aggregate, can't trace.

**Fix**: structlog + json renderer. Mandatory fields per [[09 - Operations/Logging Standards]].

## 2. No trace IDs

No `X-Request-ID` propagation. Debugging a 5xx in production = SSH-and-grep across 9 services.

**Fix**: Generate at gateway if absent; propagate to every cross-service call; include in every log entry.

## 3. No metrics

No Prometheus exporter, no RED dashboards, no SLO board.

**Fix**: [[09 - Operations/Observability Stack#Metrics to emit per service P1]].

## 4. Health check is liveness-only

`/health` returns 200 even if Mongo is unreachable (as long as the FastAPI process is alive). Kubernetes won't restart a service that *should* be restarted.

**Fix**: `/ready` checks downstream dependencies. K8s uses `readinessProbe` for `/ready`, `livenessProbe` for `/health`.

## 5. Background task failures are silent

`BackgroundTasks` swallow exceptions. The `analyze-project` background job can fail repeatedly and we'd never know.

**Fix**: Wrap in try/except with structured log. Track failure counts per task type. Alert on threshold.

## 6. Batch processor doesn't emit lag metric

`batch_processor_lag_seconds` doesn't exist. We can't alert on it.

**Fix**: Compute lag = now() - oldest_unprocessed_raw.ingested_at; emit every tick.

## 7. GDS fallback is silent

If THG `/influence` falls back to native Cypher because GDS is down, there's no log, no metric.

**Fix**: Log at WARN every fallback; emit counter; alert if counter > 0 for 5 min.

## 8. Fraud flag rate is opaque

A spike in `reliability_score < 0.5` could indicate: (a) bot attack, (b) anomaly detector calibration drift, (c) a real change in user behavior. No dashboard.

**Fix**: Histogram of reliability_score per batch; per-user p95 reliability over time.

## 9. WebSocket lifecycle invisible

How many concurrent WS connections? How often do they reconnect? What's the buffer depth?

**Fix**: Gauge `ws_connections_active`, counter `ws_reconnects_total`, histogram `ws_buffer_depth`.

## 10. No alerting

There's no PagerDuty / Opsgenie integration. The Tech Admin would have to be watching the HUD to notice an outage.

**Fix**: Prometheus → AlertManager → PagerDuty pipeline. Multi-window burn rate alerts per [[09 - Operations/SLOs & SLIs]].

## 11. Audit log lacks `request_id`

When tracing "what happened during request X", we can't easily join across logs and audit entries.

**Fix**: Audit entries include `request_id` (from header).

## 12. No cost metrics

We don't track per-tenant cost (CodeBERT inference time, Mongo writes, etc.). A misbehaving customer could rack up serious cost before we know.

**Fix**: Per-tenant counters: `cost_codebert_ms_total`, `cost_mongo_writes_total`, `cost_thg_writes_total`. Roll up nightly per tenant.

---

Each gap → [[13 - Yet to Implement/_MOC]].
