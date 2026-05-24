---
tags: [risk-security, risk-data-loss, risk-scale]
---

# Top Risks (Ranked)

> Reviewer: an independent principal engineer / security architect. Honest take. **Numbers are estimated likelihood × impact.** Track each in [[13 - Yet to Implement/_MOC]].

## 🟥 P0 — Ship blockers

| # | Risk | Likelihood | Impact | Tracked |
|:-:|:-----|:----------:|:------:|:--------|
| 1 | **RBAC header is client-controlled** — any user can claim `tech_admin` | Very High | Catastrophic | [[13 - Yet to Implement/Backend - All - RBAC Signed]] |
| 2 | **No JWT / refresh tokens** — `localStorage`-based session, no expiry | High | Catastrophic | [[13 - Yet to Implement/Backend - Auth - JWT + Sessions]] |
| 3 | **Code snippet & snapshot exfiltration** — no secret scan, no encryption-at-rest for snippets | Medium-High | Catastrophic (real customer source code) | [[13 - Yet to Implement/Extension - Secret Filter]], [[13 - Yet to Implement/Backend - Telemetry - Snippet Envelope Encryption]] |
| 4 | **Service-to-service unauthenticated** — compromised pod can hit any service freely | Medium | High | [[13 - Yet to Implement/Backend - All - Service-to-Service Auth]] |
| 5 | **Fusion services stubbed** — anomaly, normalizer, weight engine, project analyzer all empty | Confirmed (Code review) | Product fails to deliver core promise | [[13 - Yet to Implement/Backend - Fusion - Real ML Pipeline]] |
| 6 | **No rate limiting anywhere** — `/ingest`, `/login`, `/register` floodable | High | High (DoS + abuse) | [[13 - Yet to Implement/Backend - Gateway - Rate Limiting]] |
| 7 | **`POST /generate-demo-data` destroys Neo4j with no auth** | High | Catastrophic | [[13 - Yet to Implement/Backend - THG - Demo Endpoint Gate]] |
| 8 | **Data Explorer is unmitigated** — read/write on any Mongo collection, returns `password_hash` | Confirmed (Code review) | Catastrophic | [[13 - Yet to Implement/Backend - Auth - Data Explorer Hardening]] |

## 🟧 P1 — Production readiness

| # | Risk | Likelihood | Impact | Tracked |
|:-:|:-----|:----------:|:------:|:--------|
| 9 | No retries / circuit breakers on cross-service calls | High | High | [[13 - Yet to Implement/Backend - All - Resilient HTTP Client]] |
| 10 | Batch processor: no DLQ, no leader election; single point of failure | Medium-High | High | [[13 - Yet to Implement/Backend - Telemetry - DLQ]] |
| 11 | No structured logs, no trace IDs, no metrics | Confirmed | High (ops blindness) | [[13 - Yet to Implement/Backend - All - Structured Logs + TraceID]] |
| 12 | No readiness probes (only liveness) | Medium | Medium | [[13 - Yet to Implement/Backend - All - Health & Readiness Probes]] |
| 13 | Snapshot upload via base64 in request body — DoS + memory pressure | High | High | [[13 - Yet to Implement/Backend - Telemetry - Snapshot Storage]] |
| 14 | No GDPR right-to-erase | Confirmed | Catastrophic (regulatory) | [[13 - Yet to Implement/Compliance - GDPR Right to Erase]] |
| 15 | No GDPR data export | Confirmed | High (regulatory) | [[13 - Yet to Implement/Compliance - GDPR Data Export]] |
| 16 | No audit log retention policy or immutability proof | Confirmed | High | [[13 - Yet to Implement/Backend - Monitoring - Audit Retention Policy]], [[13 - Yet to Implement/Backend - Monitoring - Audit Hash Chain]] |
| 17 | `POST /system-config` not audited (the config-change itself isn't audited!) | Confirmed | Medium | [[13 - Yet to Implement/Backend - Monitoring - Audit System Config]] |
| 18 | THG `/match` and `/leaderboard` not cached — Allocation hot path scans 10k+ devs every call | Confirmed | Medium (perf at scale) | [[13 - Yet to Implement/Backend - Allocation - Dev Cache]] |
| 19 | No DTO versioning — a breaking change cascades everywhere | Confirmed | Medium | [[13 - Yet to Implement/Backend - All - DTO Versioning]] |
| 20 | No CI pipeline | Confirmed | Medium (slow feedback) | [[13 - Yet to Implement/Infra - CI Pipeline]] |

## 🟨 P2 — Hardening

| # | Risk | Tracked |
|:-:|:-----|:--------|
| 21 | Two Neo4j drivers (Analytics + THG) — code duplication | [[13 - Yet to Implement/Backend - All - Shared Neo4j Driver]] |
| 22 | DTOs duplicated in THG router instead of shared/ | [[13 - Yet to Implement/Backend - THG - Move DTOs to Shared]] |
| 23 | Routes prefix doubled: `/api/v1/fusion/fusion/...` | [[13 - Yet to Implement/Backend - Fusion - Route Prefix Cleanup]] |
| 24 | `tasks` Mongo collection defined but unused | [[13 - Yet to Implement/Backend - Task - Mongo Tasks Collection]] |
| 25 | Legacy Vite frontend not yet removed | [[13 - Yet to Implement/Frontend - Remove Legacy Vite App]] |
| 26 | CORS `allow_origins=["*"]` on individual services | [[13 - Yet to Implement/Backend - All - Tighten CORS]] |
| 27 | No batch CodeBERT inference path | [[13 - Yet to Implement/Backend - Fusion - Batch CodeBERT]] |
| 28 | No model version tracking per fusion result | [[13 - Yet to Implement/Backend - Fusion - Model Version Field]] |
| 29 | No GDS fallback metric | [[13 - Yet to Implement/Backend - THG - GDS Fallback Metric]] |
| 30 | Hardcoded skill enum scattered across 5 files | [[13 - Yet to Implement/Backend - All - Skill Enum Single Source]] |

## 🟦 P3 — Polish

See [[13 - Yet to Implement/P2 - Hardening & Polish]] for items 31+.

## Summary

> ADT has a **strong architecture**, **good security design intent**, and **catastrophic implementation gaps**. The architecture earns trust; the implementation can't sustain it under any adversarial review. **Fix P0–P1 before any production customer.**

Estimated effort to clear P0+P1: ~6–10 engineer-weeks. P2+P3: another ~8 weeks.
