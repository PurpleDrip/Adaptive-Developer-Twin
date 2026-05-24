---
tags: [moc, yet-to-implement]
---

# 13 — Yet to Implement · Map of Content

> Agent-actionable punch list. Each note has: rationale, acceptance criteria, files involved.
>
> **If you're an agent reading this — START HERE**: [[README - For Agents]].

## Priority tiers

- [[P0 - Critical Blockers]] — must ship before any prod customer
- [[P1 - Production Readiness]] — must ship within Tier-1 deadline
- [[P2 - Hardening & Polish]] — quality bar
- [[Done]] — completed items, archived

## By area

> Each title links into a note with the same name. Filter `#yet-to-implement` to see the full list.

### Backend — Auth

- [[Backend - Auth - JWT + Sessions]]
- [[Backend - Auth - Refresh Tokens]]
- [[Backend - Auth - Bcrypt Cost]]
- [[Backend - Auth - MFA]]
- [[Backend - Auth - Data Explorer Hardening]]
- [[Backend - Auth - Saga for Registration]]
- [[Backend - Auth - Project Analysis Status]]
- [[Backend - Auth - Unlock Endpoint]]
- [[Backend - Auth - Username Cross-Collection Uniqueness]]
- [[Backend - Auth - Promote User Endpoint]]
- [[Backend - Auth - Behavioral Limits]]

### Backend — Telemetry

- [[Backend - Telemetry - DLQ]]
- [[Backend - Telemetry - Idempotency Key]]
- [[Backend - Telemetry - Snapshot Storage]]
- [[Backend - Telemetry - Snapshot Encryption]]
- [[Backend - Telemetry - Snippet Envelope Encryption]]
- [[Backend - Telemetry - Server-Side Secret Scan]]
- [[Backend - Telemetry - Retention Policy]]
- [[Backend - Telemetry - Parallel Batch Users]]
- [[Backend - Telemetry - Leader Election]]
- [[Backend - Telemetry - Lift Batch Limit]]
- [[Backend - Telemetry - Sliding Mode]]
- [[Backend - Telemetry - Status Composite Index]]
- [[Backend - Telemetry - Aggregation Fairness Review]]

### Backend — Fusion

- [[Backend - Fusion - Real ML Pipeline]]
- [[Backend - Fusion - Anomaly Detector]]
- [[Backend - Fusion - Reliability Calibration]]
- [[Backend - Fusion - SCM-Audit Implementation]]
- [[Backend - Fusion - Active Learning]]
- [[Backend - Fusion - Model Warm-up]]
- [[Backend - Fusion - Batch CodeBERT]]
- [[Backend - Fusion - GPU + Triton]]
- [[Backend - Fusion - Route Prefix Cleanup]]
- [[Backend - Fusion - Model Version Field]]
- [[Backend - Fusion - SSRF Guard]]
- [[Backend - Fusion - GitHub Hardening]]
- [[Backend - Fusion - Drift Detection]]

### Backend — THG

- [[Backend - THG - Move DTOs to Shared]]
- [[Backend - THG - GDS Fallback Metric]]
- [[Backend - THG - Demo Endpoint Gate]]
- [[Backend - THG - Per-Skill Decay Rate]]
- [[Backend - THG - Influence Cache]]
- [[Backend - THG - Revert Endpoint]]

### Backend — Allocation

- [[Backend - Allocation - Dev Cache]]
- [[Backend - Allocation - Hungarian Implementation]]
- [[Backend - Allocation - Stretch Flag]]
- [[Backend - Allocation - Exclusion List]]

### Backend — Task

- [[Backend - Task - Mongo Tasks Collection]]
- [[Backend - Task - Assessment Engine]]
- [[Backend - Task - BGSC Config]]
- [[Backend - Task - Stretch Flag]]
- [[Backend - Task - Org-wide Matching]]

### Backend — Analytics

- [[Backend - Analytics - Implement VDA]]
- [[Backend - Analytics - Stubs to Real]]

### Backend — Monitoring

- [[Backend - Monitoring - WS Audit Stream]]
- [[Backend - Monitoring - Audit System Config]]
- [[Backend - Monitoring - Audit Hash Chain]]
- [[Backend - Monitoring - Audit Retention Policy]]
- [[Backend - Monitoring - Mongo Role Insert Only]]

### Backend — Gateway

- [[Backend - Gateway - Rate Limiting]]
- [[Backend - Gateway - JWT Verification Edge]]
- [[Backend - Gateway - Body Size Limits]]

### Backend — All services

- [[Backend - All - RBAC Signed]]
- [[Backend - All - Service-to-Service Auth]]
- [[Backend - All - Health & Readiness Probes]]
- [[Backend - All - Resilient HTTP Client]]
- [[Backend - All - Structured Logs + TraceID]]
- [[Backend - All - Tests]]
- [[Backend - All - DTO Versioning]]
- [[Backend - All - OpenAPI Catalog]]
- [[Backend - All - Tighten CORS]]
- [[Backend - All - Shared Neo4j Driver]]
- [[Backend - All - Skill Enum Single Source]]
- [[Backend - All - BOLA Checks]]
- [[Backend - All - Retention Automation]]

### Extension

- [[Extension - Offline Buffer]]
- [[Extension - Secret Filter]]
- [[Extension - Path Sanitization]]
- [[Extension - Native HWID]]
- [[Extension - Hot Heartbeat Reload]]
- [[Extension - Background Sync]]

### Frontend

- [[Frontend - Auth Context Hardening]]
- [[Frontend - WebSocket Reconnect]]
- [[Frontend - Error Boundaries]]
- [[Frontend - Role Gating Server-Side]]
- [[Frontend - Mode Switcher]]
- [[Frontend - React Query Migration]]
- [[Frontend - Accessibility CI]]
- [[Frontend - i18n Stub]]
- [[Frontend - Remove Legacy Vite App]]

### Infrastructure

- [[Infra - CI Pipeline]]
- [[Infra - Observability (OTEL)]]
- [[Infra - Secrets via Vault]]
- [[Infra - K8s Migration]]
- [[Infra - TLS Everywhere]]
- [[Infra - KMS Setup]]
- [[Infra - Compose File Hardening]]
- [[Infra - SBOM + Sigstore]]
- [[Infra - Load Test Harness]]
- [[Infra - DR Drill Quarterly]]
- [[Infra - Mongo Sharding]]
- [[Infra - Kafka for Telemetry]]
- [[Infra - Redis Streams for Audit Replay]]
- [[Infra - Pre-Commit Secret Scan]]
- [[Infra - HF Model Mirror]]
- [[Infra - Migration Framework]]
- [[Infra - Feature Flags]]

### Compliance

- [[Compliance - GDPR Right to Erase]]
- [[Compliance - GDPR Data Export]]
- [[Compliance - DPIA Draft]]
- [[Compliance - Audit Log Retention]]

### Simulation

- [[Simulation - Mode Switch + Seed Data]]
- [[Simulation - Embedded IDE Panel]]
- [[Simulation - Demo Driver Engine]]
- [[Simulation - Recipe Runner UI]]
- [[Simulation - Scripted Demo Driver]]
- [[Simulation - Safe Mode Tests]]
- [[Simulation - DTO Fixture Test]]

### Scripts / DX

- [[Scripts - Seeder Hard Stops]]
- [[Documentation - README Ports]]

---

## How to use this folder

See [[README - For Agents]].
