---
tags: [meta, glossary, reference]
created: 2026-05-24
---

# Glossary

> Every ADT-specific term, defined once. If you find yourself defining a term in another note, **link here instead** and add it to this file.

---

## A

- **ADT** — Adaptive Developer Twin. The platform name.
- **Allocation Engine** — Service (`:8005`) that ranks developers against tasks via cosine similarity + Hungarian optimization. See [[03 - Microservices/Allocation Service]].
- **Anomaly Detector** — Sub-module in [[03 - Microservices/Fusion Service|Fusion]] that flags non-human typing patterns (keystroke padding, missing human jitter).
- **Async-Redis-WS** — Non-blocking realtime stream pattern using Redis pub/sub + WebSockets. Pillar #9. See [[07 - Algorithms/Async-Redis-WS]].
- **Audit Log** — `audit_logs` collection in Mongo. Append-only record of every skill mutation, assignment, config change. See [[06 - Data Models/DTO - Audit Log]].

## B

- **Batch** — A `telemetry_batches` document aggregating many `telemetry_raw` records for one user over one window (default 5 min). See [[06 - Data Models/DTO - Telemetry Batch]].
- **Batch Processor** — APScheduler-driven worker in [[03 - Microservices/Telemetry Service|Telemetry]] that produces batches. See [[07 - Algorithms/SWEF-Ingestion (Sliding Window)]].
- **Bayesian Fusion** — Confidence-weighted combination of telemetry, semantic, and project evidence per skill. See [[07 - Algorithms/Bayesian Skill Fusion]].
- **BGSC** — *Bounded Growth & Self-Correction*. Guardrail algorithm in Task service that ensures skill changes are incremental + verified. Pillar #5.

## C

- **CodeBERT** — Microsoft's pretrained transformer (`microsoft/codebert-base`) used as the semantic brain in Fusion. Pillar #1.
- **Confidence** — Per-skill statistic (0.0–1.0) representing how *certain* we are about a skill estimate. Distinct from **strength**.
- **CSA-Matching** — *Cosine Skill Affinity Matching*. Vector-space task↔dev fit scoring. Pillar #7.

## D

- **DCT** — *Developer Capability Twin*. The user-facing name for an individual's Neural Twin. The vault folder is named DCT for this reason.
- **Decay** — Skill strengths decrease exponentially over time when not exercised. Model: `strength * exp(-0.1 * days)`. See [[07 - Algorithms/Temporal Decay Model]].
- **Deep Audit** — One-shot initial scan of a developer's workspace snapshot (zip) to bootstrap a baseline THG profile. Endpoint: `POST /api/v1/fusion/deep-audit`.
- **Diff Payload** — Unified diff for the active window inside a telemetry record. Used as a content hash to avoid re-ingesting identical states.

## E

- **EVC-Influence** — *Eigenvector Centrality Influence*. PageRank-based ranking of developers by graph centrality in the THG. Pillar #6.
- **Extension ID** — Issued at registration. The credential that binds a VS Code install to a user. Must be paired with a `machine_id` via [[07 - Algorithms/SHA-HWID Anchor|SHA-HWID]].

## F

- **Fusion Engine** — Service (`:8003`) — semantic + telemetry fusion → skill confidence updates → THG writes.
- **Fusion Result** — JSON object embedded in each `telemetry_batches` doc containing the reliability check + per-skill confidence updates.

## G

- **GDS** — Neo4j Graph Data Science library. Used for PageRank in [[07 - Algorithms/EVC-Influence (PageRank)]]. Has a [[07 - Algorithms/Native Cypher Fallback|fallback]].

## H

- **Hardware Lock** — One-time binding of a VS Code extension to a machine via SHA hash of CPU/motherboard ID. See [[07 - Algorithms/SHA-HWID Anchor]].
- **Heartbeat Interval** — Time between raw telemetry pings from the extension. Default 30s. Configurable via [[03 - Microservices/Monitoring Service|monitoring]] `/system-config`.
- **HRM** — Human Resource Manager role. One of the admin sub-roles in [[03 - Microservices/Auth Service|Auth]].
- **HUD** — *Heads-Up Display*. Used for the [[10 - UX & UI/Dashboard Layouts - Developer|Radar HUD]] (developer) and [[03 - Microservices/Monitoring Service|Live Audit HUD]] (tech admin).

## I

- **Idle Seconds** — Number of seconds with no input activity in the current window. Used to distinguish deep work from blocked sessions.
- **Identity Isolation** — Separate Mongo collections (`users`, `managers`, `tech_staff`) prevent role escalation by design. See [[08 - Security & Compliance/Identity Isolation]].
- **Ingest** — `POST /api/v1/telemetry/ingest` — write a raw telemetry record.

## L

- **Live Audit HUD** — Realtime audit-log visualization for Tech Admin. Powered by [[07 - Algorithms/Async-Redis-WS]].

## M

- **Machine ID** — `vscode.env.machineId`, a stable per-install identifier. Combined with `extension_id` to form the SHA-HWID anchor.
- **MOC** — *Map of Content*. An Obsidian convention — an index note that links to a cluster of related notes. Every top-level folder has a `_MOC.md`.

## N

- **Native Cypher Fallback** — When GDS isn't available, run a hand-written Cypher query that approximates PageRank via skill-density. Pillar #10.
- **Neural Twin** — Synonym for [[#D|DCT]]. The graph + skill state representing one developer.

## P

- **PageRank** — Algorithm used in [[07 - Algorithms/EVC-Influence (PageRank)]] to rank developers by influence.
- **Pillar** — One of the 10 named proprietary algorithms. See [[01 - Overview/10 Pillar Algorithms]].
- **PM** — Project Manager role.
- **Polymorphic Auth** — Login flow that looks the user up in *three* collections (users / managers / tech_staff) and returns whichever matches. See [[03 - Microservices/Auth Service]].

## R

- **Radar HUD** — Developer's skill-radar dashboard view.
- **RBAC** — Role-Based Access Control. Implemented via the `X-User-Role` header dependency in [[shared/auth/rbac]]. See [[08 - Security & Compliance/RBAC Matrix]].
- **Reliability Score** — Composite (0.0–1.0) score per batch indicating whether the telemetry looks human. Below threshold → `fraud_flag: true`.

## S

- **SCM-Audit** — *Source Code Management Audit*. AST-based parser that maps file structure to skill taxonomy. Pillar #2.
- **SHA-HWID** — *SHA Hardware ID*. The crypto-anchor pillar (#4) binding extension to machine.
- **SHAP** — *SHapley Additive exPlanations*. Used by [[07 - Algorithms/SHAP Explainability]] to attribute *why* a skill score moved.
- **SHEC** — *State Hash & Extension Check* protocol — telemetry handshake confirming the extension is in sync with the server's last-known state.
- **Skill** — A node in the THG (e.g. `backend`, `frontend`, `devops`). Has `strength` and `confidence`.
- **Squad** — Group of developers under one manager. Enforced via the `MANAGES` edge in THG and queried via `/squad/{manager_id}`.
- **Strength** — Per-skill numeric (0.0–1.0) representing demonstrated capability. Decays over time without reinforcement.
- **SWEF-Ingestion** — *Sliding Window Event Fusion Ingestion*. Pillar #3. The aggregation algorithm behind [[03 - Microservices/Telemetry Service|Telemetry]].
- **Sync Type** — `INITIAL` / `DELTA` / `FINAL`. Drives different code paths in ingest. See [[04 - VS Code Extension/SHEC Sync Protocol]].

## T

- **Tech Admin** — Highest-privilege role. Owns infra + global config. See [[10 - UX & UI/Dashboard Layouts - Tech Admin]].
- **Telemetry Raw** — `telemetry_raw` collection. One document per 30 s ping.
- **THG** — *Talent / Hiring Graph*. The Neo4j store. Service `:8004`. See [[03 - Microservices/THG Service]].
- **Tier-1** — Production-grade reliability bar. See [[01 - Overview/Tier-1 Production Bar]].
- **Top Files** — Map of file paths → time spent, computed per batch.

## V

- **VDA-Oversight** — *Velocity Decay Analytics*. Linear-regression burnout predictor. Pillar #8.
- **Vault** — This Obsidian folder (DCT/).

## W

- **WebSocket** — Used by [[03 - Microservices/Monitoring Service|Monitoring]] to push live audit events to the Tech Admin dashboard.
- **Whitelist** — Mongo collection mapping `extension_id` → approved `machine_id`. Updated on first hardware lock.
- **Window** — Time slice covered by one batch (`window_start` → `window_end`). Default 5 min.
- **WPM** — Words per minute. Cap = 200 in code; values >300 are treated as bots in `wpm_values`.

## Z

- **Zero-Trust** — Security stance: every cross-service call is authenticated; nothing is trusted by network position alone. See [[08 - Security & Compliance/Threat Model]].
