---
tags: [operations, observability]
---

# Observability and Alerting

To maintain Tier-1 standards (99.9% availability), ADT implements a structured logging and monitoring architecture utilizing Prometheus, Grafana, and OpenTelemetry (OTel).

## Logging Guidelines
- **JSON Format**: Structured JSON logs are emitted by all services (`logger.py`).
- **PII Redaction**: Telemetry input streams are scrubbed before logging.
- **Trace Propagation**: HTTP requests are stamped with a unique `x-correlation-id` at the API Gateway. This ID is passed in headers to all services and injected into every log entry.

## SLO & Alerting Matrix

We define our alerts based on Service Level Objectives (SLOs) rather than arbitrary host CPU thresholds:

| Service | Target Metric | SLA / SLO | Alert Severity | Trigger Condition |
|:---|:---|:---|:---|:---|
| **Gateway** | Ingress Latency | `p99 < 200ms` | Critical | Error rate > 0.1% for 3 min |
| **Telemetry** | `/ingest` Ingest Uptime | `99.9% Uptime` | P0 Critical | Ingest failures > 5% for 1 min |
| **Telemetry** | Batch Processor Lag | `< 2 unprocessed` | Warning | Raw queue backlog > 5000 docs |
| **Fusion** | ML Execution Lag | `< 800ms per user`| Warning | Batch processing duration > 5 min |
| **THG** | Neo4j Centrality | `p95 < 1s` | Major | Query timeout errors > 1% |

## Grafana Dashboard Core Panels
1. **Live Audit Heartbeat Map**: Displays telemetry activity streams by whitelisted whitelists.
2. **Burnout Risks Alert List**: Aggregated VDA risk markers mapped across teams.
3. **Queue Health Monitor**: Backpressure visualization of Telemetry Batch Processors.
