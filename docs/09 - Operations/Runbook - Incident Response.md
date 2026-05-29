---
tags: [reliability]
---

# Runbook — Incident Response

> Master flow. Sub-runbooks for specific scenarios:
>
> - [[Runbook - DB Outage]]
> - [[Runbook - Fusion Engine Stuck]]
> - [[Runbook - Batch Processor Drift]]

## Step 1 — Acknowledge & broadcast (≤ 5 min)

1. Ack pager
2. Post in `#ops-pager`:
   ```
   📛 INC-2026-NNN  pager: <description>  by @<you>
   ```
3. Update status page → "Investigating"

## Step 2 — Confirm scope (≤ 10 min)

```bash
# Check overall health
curl -s https://api.adt.example.com/api/v1/monitoring/system-health | jq .

# Check error rate per service in Grafana
# Open: https://grafana.adt.example.com/d/services-overview

# Check recent deploys (was it a release?)
kubectl rollout history deploy --all-namespaces | head -20
```

## Step 3 — Triage

Match the symptom to a sub-runbook:

| Symptom | Runbook |
|:--------|:--------|
| Mongo / Neo4j / Redis unreachable | [[Runbook - DB Outage]] |
| Fusion 5xx or hanging | [[Runbook - Fusion Engine Stuck]] |
| Batch lag rising | [[Runbook - Batch Processor Drift]] |
| Gateway 502 | likely upstream — check `/system-health` |
| Login latency >2s | bcrypt cost? Mongo? — see [[Runbook - DB Outage]] |
| WS audit blank | Redis? Monitoring service? |

## Step 4 — Mitigate

In priority order:

1. **Rollback** if recent deploy: `kubectl rollout undo deploy/<svc>`
2. **Scale** if load: `kubectl scale deploy/<svc> --replicas=<2x>`
3. **Feature flag off** if a specific feature is broken
4. **Failover** if region/cluster issue
5. **Drop traffic** at gateway if cascade risk

## Step 5 — Verify

```bash
# Run smoke
./scripts/smoke.sh prod

# Watch SLO board for 15 min
# Acceptable: error budget burn rate falls below 1×
```

## Step 6 — Communicate resolution

- Status page → "Resolved"
- Slack: short summary
- Email to customers if customer-impacting (use template `notif/incident-resolved.md`)

## Step 7 — Postmortem

Within 5 business days. See [[On-Call Playbook#After postmortem]].
