---
tags: [operations, runbook]
---

# Troubleshooting & Runbooks

Operational checklists to handle catastrophic system failures.

## Runbook 1: Telemetry Batch Processor Drift
### Problem:
The Telemetry `BatchProcessor` cannot keep up with the incoming rate of raw JSON packets. `lag(unprocessed_raw)` is rising.

### Diagnostic Actions:
1. Query the processing lag:
   ```bash
   curl http://localhost:8007/api/v1/monitoring/batch-status
   ```
2. Verify Fusion Service availability. If Fusion Service is slow (p99 latency > 2s), BatchProcessor queues will back up.

### Mitigation Actions:
- **Temporary Remediation**: Scale the Telemetry Service container count or increase the `batch_interval_minutes` via the Monitoring Service system-config interface.
- **Permanent Remediation**: Enable consistent hashing partition scaling in Kubernetes.

## Runbook 2: Neo4j GDS Plugin Failure
### Problem:
Graph Data Science plugin crashes or goes offline. PageRank calculations fail.

### Diagnostic Actions:
- Look for error logs in the THG service containing: `Neo.ClientError.Procedure.ProcedureRegistrationFailed`.

### Mitigation Actions:
The THG Service will automatically switch to the **[[07 - Algorithms/Native Cypher Fallback]]** engine. 
1. Validate fallback state: `curl http://localhost:8008/api/v1/thg/health`
2. Schedule a database restart during the off-hours maintenance window to re-initialize the GDS plugin.
