---
tags: [overview, reliability, p0]
status: living-document
---

# Tier-1 Production Bar

> The minimum we accept before shipping to enterprise customers. **Every item must be measurable and verifiable.** Items currently failing are tracked in [[12 - Expert Review/Tier-1 Production Gap Analysis]].

## 1. Reliability

- [ ] **99.9 %** monthly availability of `/api/v1/telemetry/ingest`
- [ ] **99.95 %** monthly availability of `/api/v1/auth/users/login`
- [ ] **Zero data loss** of accepted (HTTP 201) telemetry records
- [ ] Every microservice has a `/health` (liveness) *and* `/ready` (readiness) endpoint
- [ ] Every microservice survives the loss of any one downstream dependency without cascading failure

## 2. Performance

- [ ] `p99` ingest latency **< 200 ms** at 10 k concurrent extensions
- [ ] `p99` login latency **< 400 ms**
- [ ] Fusion batch processing keeps up with ingest: `lag(unprocessed_raw) < 2 batches`

## 3. Security

- [ ] TLS 1.3 enforced everywhere; HTTP redirects to HTTPS
- [ ] Secrets come from a **secrets manager** (Vault / AWS SM / Doppler), not `.env` files in containers
- [ ] All `password_hash` is bcrypt cost ≥ 12 (current code uses passlib defaults — verify)
- [ ] [[07 - Algorithms/SHA-HWID Anchor]] cannot be bypassed by an attacker with stolen `extension_id`
- [ ] Replay attacks defeated — every telemetry POST carries a server-issued nonce
- [ ] RBAC enforced **at the service**, not the gateway (defense in depth)

## 4. Data Integrity

- [ ] Every skill mutation in THG traces back to a `batch_id` in `audit_logs`
- [ ] No raw telemetry record is double-counted in two batches
- [ ] Schema migrations are reversible and tested in CI
- [ ] Backups for Mongo + Neo4j daily; PITR for 7 days

## 5. Observability

- [ ] Structured JSON logs from every service (no `print()`)
- [ ] OpenTelemetry trace IDs propagated end-to-end through gateway → microservices → DB
- [ ] Per-endpoint RED metrics (Rate, Errors, Duration) in Prometheus
- [ ] Per-batch lag, error rate, and confidence-shift histogram dashboards
- [ ] SLO-based alerting (not threshold-based)

## 6. Privacy & Compliance

- [ ] **GDPR**: full Right-to-Erase implemented (Mongo + Neo4j + Redis + backups)
- [ ] **GDPR**: full data export per developer ([[08 - Security & Compliance/Telemetry Consent & Ethics]])
- [ ] Audit log immutable + 7-year retention
- [ ] PII (email, phone) never in logs at any level
- [ ] Workspace snapshots encrypted at rest and access-logged

## 7. Deployability

- [ ] One-command deploy (`make deploy ENV=staging`)
- [ ] Each commit on `main` produces a deterministic container hash
- [ ] Blue-green or canary deploy with automatic rollback on SLO breach

## 8. Testing

- [ ] **Unit** coverage ≥ 70 % per service
- [ ] **Integration** coverage of every cross-service hop in [[02 - System Architecture/Service Communication Matrix]]
- [ ] **Contract tests** between consumers/producers of DTOs in `shared/`
- [ ] **Load test** at 10 k concurrent extensions in CI weekly
- [ ] **Chaos test** monthly: kill each service, verify graceful degradation

## 9. Developer Experience (internal)

- [ ] One-command local bootstrap (`./scripts/setup_backend.ps1`) on a clean Windows + macOS + Linux box
- [ ] CONTRIBUTING.md with the path-to-PR documented
- [ ] Pre-commit hooks for lint + typing + secret scan

## 10. Documentation

- [ ] This vault stays in lockstep with code (validated by a CI job that flags drift)
- [ ] Every public endpoint is in the Postman collection AND in [[06 - Data Models/Cross-Service DTO Contracts]]
- [ ] Runbooks exist for every alert in the on-call rotation

---

## Status (snapshot)

See [[12 - Expert Review/Tier-1 Production Gap Analysis]] for the live tally.
