---
tags: [reliability]
---

# Mitigation Roadmap

> A sprint-by-sprint plan to close the [[Tier-1 Production Gap Analysis|Tier-1 gaps]]. Each sprint ~2 weeks.

## Sprint 1 — Auth & RBAC

- [[13 - Yet to Implement/Backend - Auth - JWT + Sessions]]
- [[13 - Yet to Implement/Backend - Auth - Refresh Tokens]]
- [[13 - Yet to Implement/Backend - All - RBAC Signed]]
- [[13 - Yet to Implement/Backend - Auth - Bcrypt Cost]]

## Sprint 2 — Telemetry resilience

- [[13 - Yet to Implement/Backend - Telemetry - DLQ]]
- [[13 - Yet to Implement/Backend - Telemetry - Idempotency Key]]
- [[13 - Yet to Implement/Backend - All - Resilient HTTP Client]]
- [[13 - Yet to Implement/Backend - All - Health & Readiness Probes]]

## Sprint 3 — Security perimeter

- [[13 - Yet to Implement/Extension - Secret Filter]]
- [[13 - Yet to Implement/Backend - Telemetry - Server-Side Secret Scan]]
- [[13 - Yet to Implement/Backend - Telemetry - Snapshot Storage]]
- [[13 - Yet to Implement/Backend - Gateway - Rate Limiting]]
- [[13 - Yet to Implement/Backend - Fusion - SSRF Guard]]

## Sprint 4 — Observability

- [[13 - Yet to Implement/Backend - All - Structured Logs + TraceID]]
- [[13 - Yet to Implement/Infra - Observability (OTEL)]]
- [[13 - Yet to Implement/Backend - Monitoring - Audit Hash Chain]]
- [[13 - Yet to Implement/Backend - Monitoring - Audit System Config]]

## Sprint 5 — Fusion brain

- [[13 - Yet to Implement/Backend - Fusion - Real ML Pipeline]] (anomaly + normalizer + weight engine + Bayesian)
- [[13 - Yet to Implement/Backend - Fusion - Model Warm-up]]
- [[13 - Yet to Implement/Backend - Fusion - Reliability Calibration]]

## Sprint 6 — Compliance

- [[13 - Yet to Implement/Compliance - GDPR Right to Erase]]
- [[13 - Yet to Implement/Compliance - GDPR Data Export]]
- [[13 - Yet to Implement/Compliance - DPIA Draft]]
- [[13 - Yet to Implement/Backend - Monitoring - Audit Retention Policy]]

## Sprint 7 — Scale prep

- [[13 - Yet to Implement/Backend - Allocation - Dev Cache]]
- [[13 - Yet to Implement/Backend - Telemetry - Parallel Batch Users]]
- [[13 - Yet to Implement/Backend - Telemetry - Leader Election]]
- [[13 - Yet to Implement/Backend - Fusion - Batch CodeBERT]]

## Sprint 8 — Operations + CI

- [[13 - Yet to Implement/Infra - CI Pipeline]]
- [[13 - Yet to Implement/Backend - All - Tests]]
- [[13 - Yet to Implement/Infra - Load Test Harness]]
- [[13 - Yet to Implement/Infra - Pre-Commit Secret Scan]]

## Sprint 9 — Simulation Mode for demos

- [[13 - Yet to Implement/Simulation - Mode Switch + Seed Data]]
- [[13 - Yet to Implement/Simulation - Embedded IDE Panel]]
- [[13 - Yet to Implement/Simulation - Demo Driver Engine]]
- [[13 - Yet to Implement/Simulation - Safe Mode Tests]]

## Sprint 10 — Hardening + cleanup

- All [[13 - Yet to Implement/P2 - Hardening & Polish|P2]] items
- Documentation pass
- Postmortem of the campaign

---

## Notes

- Sprint 9 (Sim Mode) can run **in parallel** to others — it's UI-heavy and doesn't share many code paths with the core. Assign a separate engineer.
- Sprint 5 (Fusion brain) is the longest individual sprint. Consider splitting across two sprints.
- After Sprint 8, run a **security review** (external or internal red team). Fix what they find before claiming Tier-1.
