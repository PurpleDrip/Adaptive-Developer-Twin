---
tags: [reliability, observability]
---

# SLOs & SLIs

> SLOs define what "good service" means in numbers. SLIs are how we measure them. Error budget = `1 - SLO`.

## SLOs (target)

| Service / Flow | SLO | Window | SLI |
|:---------------|:----|:------:|:----|
| `POST /telemetry/ingest` availability | 99.9% | 30d rolling | `1 - (rate(5xx) / rate(total))` |
| `POST /telemetry/ingest` p99 latency | < 200ms | 30d | `histogram_quantile(0.99, http_duration{ep="/ingest"})` |
| `POST /auth/login` availability | 99.95% | 30d | same |
| `POST /auth/login` p99 latency | < 400ms | 30d | same |
| `GET /thg/skills/*` availability | 99.5% | 30d | same |
| Fusion batch lag | < 600s | 24h | `max(batch_processor_lag_seconds)` |
| Audit log durability | 100% | 30d | accepted requests where audit_logs row exists / accepted requests |

## Error budget burn rate alerts

Multi-window burn rate (Google SRE workbook style):

| Window | Burn rate | Severity |
|:-------|:---------:|:--------:|
| 1h | 14.4× | P0 (page) |
| 6h | 6× | P1 (alert) |
| 1d | 3× | P2 (ticket) |
| 3d | 1× | P3 (review) |

> Burn rate 14.4× means: at this pace, 100% of monthly budget consumed in 1h. Page immediately.

## SLI implementations

Examples:

```promql
# Ingest availability (5m window)
sum(rate(http_requests_total{service="telemetry",endpoint="/ingest",status=~"5.."}[5m]))
/
sum(rate(http_requests_total{service="telemetry",endpoint="/ingest"}[5m]))

# Ingest p99 latency
histogram_quantile(0.99,
  sum by (le) (rate(http_request_duration_seconds_bucket{service="telemetry",endpoint="/ingest"}[5m]))
)
```

## What is NOT in SLOs

- Internal tooling (Data Explorer UI)
- Per-batch fusion accuracy (that's a quality metric, not a reliability one)
- THG `/influence` latency — async, not user-visible
- Anything in [[11 - Simulation Mode/_MOC|Simulation Mode]] — those flows are demo-only

## Customer-facing SLA (target)

Less aggressive than internal SLOs (give yourself room):

- Ingest: **99.5%** monthly
- Login: **99.9%** monthly
- Dashboard reads: **99.0%** monthly
- Credits: 10% of monthly fee per 0.1% breach
