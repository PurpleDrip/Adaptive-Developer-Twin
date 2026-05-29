---
tags: [reliability, p0]
---

# Tier-1 Production Gap Analysis

> Going through the [[01 - Overview/Tier-1 Production Bar]] checklist, line by line. Current state.

## Reliability

| Bar | Status |
|:----|:-------|
| 99.9% ingest availability | ❌ no SLOs |
| 99.95% login availability | ❌ |
| Zero data loss for accepted ingest | ❌ no idempotency, no DLQ |
| `/health` + `/ready` everywhere | ❌ liveness only |
| Survive single-dep loss without cascade | ❌ no retries, no breakers |

## Performance

| Bar | Status |
|:----|:-------|
| p99 ingest < 200 ms @ 10k | ❌ not load-tested |
| p99 login < 400 ms | ❌ not load-tested |
| `lag(unprocessed_raw) < 2 batches` | ❌ no metric, no alert |

## Security

| Bar | Status |
|:----|:-------|
| TLS 1.3 enforced | ❌ HTTP today |
| Secrets in Vault/SM | ❌ `.env` |
| bcrypt cost ≥ 12 | ⚠ unverified |
| Hardware lock bypass requires real attack | ✓ design strong, code mostly OK |
| Replay attacks defeated | ❌ no nonces |
| RBAC enforced at service level | ❌ trusts client header |

## Data integrity

| Bar | Status |
|:----|:-------|
| Skill mutation traces to batch_id | ⚠ partial |
| No double-counting | ❌ no idempotency |
| Reversible migrations | ❌ no migration framework |
| Backups + 7d PITR | ✓ Atlas/Aura defaults |

## Observability

| Bar | Status |
|:----|:-------|
| Structured JSON logs | ❌ |
| OTEL trace IDs end-to-end | ❌ |
| RED metrics per endpoint | ❌ |
| Per-batch lag / err / confidence dashboards | ❌ |
| SLO-based alerts | ❌ |

## Privacy & compliance

| Bar | Status |
|:----|:-------|
| GDPR right-to-erase | ❌ |
| GDPR data export | ❌ |
| Audit log immutable + 7y retention | ❌ |
| PII never in logs | ⚠ depends on developer discipline (no enforcement) |
| Snapshots encrypted + access-logged | ❌ |

## Deployability

| Bar | Status |
|:----|:-------|
| One-command deploy | ❌ |
| Deterministic container hash per commit | ❌ |
| Blue/green + auto-rollback | ❌ |

## Testing

| Bar | Status |
|:----|:-------|
| Unit coverage ≥ 70% | ❌ 0% |
| Integration coverage every cross-service hop | ❌ |
| Contract tests | ❌ |
| Weekly load test 10k devs | ❌ |
| Monthly chaos test | ❌ |

## Developer experience

| Bar | Status |
|:----|:-------|
| One-command bootstrap on Win/mac/Linux | ⚠ Windows-only PowerShell scripts |
| CONTRIBUTING.md | ❌ |
| Pre-commit hooks | ❌ |

## Documentation

| Bar | Status |
|:----|:-------|
| Vault in lockstep with code (CI-validated) | ❌ (vault now exists; CI check next) |
| OpenAPI per service | ⚠ FastAPI auto-generates; not collected |
| Runbooks per alert | ⚠ runbook stubs exist (this vault) |

---

## Score

**Currently meeting**: ~5 of ~50 items (10%).
**Estimated to reach 80%**: 10–16 engineer-weeks of focused work + 1 security review + 1 SOC2 prep pass.

## Highest-value-per-effort to close first

1. RBAC signed at gateway (1 wk)
2. JWT + refresh (1 wk)
3. Secret scanner client + server (3 days)
4. Snapshot storage via signed URL (3 days)
5. Idempotency + DLQ for ingest/batch (1 wk)
6. Structured logs + trace IDs (4 days)
7. Health/readiness + service-to-service auth (1 wk)
8. Rate limiting (3 days)
9. Implement Fusion stubs (2 wks)
10. CI pipeline + tests (2 wks)

That's the **6–10 week** P0/P1 number from [[Top Risks (Ranked)#Summary]].
