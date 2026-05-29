---
tags: [yet-to-implement, p1, observability]
status: pending
priority: P1
estimate: 1 week
---

# Infra — Observability (OTEL)

## Why
We need distributed tracing, metrics, and logs centralized.

## Acceptance criteria
- [ ] OpenTelemetry SDK in every service (auto-instrumentation for FastAPI + httpx + Mongo + Redis + Neo4j)
- [ ] Traces → Tempo/Jaeger
- [ ] Metrics → Prometheus → Grafana
- [ ] Logs → Loki / CloudWatch
- [ ] Dashboards per [[09 - Operations/Observability Stack#Grafana dashboards P1]]
- [ ] Alerts per [[09 - Operations/Observability Stack#Alerts P1]]

## Files involved
- `shared/observability/setup.py` (new)
- Each service's `main.py`
- IaC for Tempo / Prometheus / Grafana / AlertManager

## Tracked from
[[09 - Operations/Observability Stack]]
