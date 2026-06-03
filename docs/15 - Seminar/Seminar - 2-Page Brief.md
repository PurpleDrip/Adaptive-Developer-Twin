# Adaptive Developer Twin (ADT) — 2-Page Brief

> **ADT builds a live "Neural Twin" of every developer from the code they actually write** — a hardware-anchored, server-fused, graph-native source of truth about engineering capability, with zero self-reporting.

---

## The Problem

How does an engineering org know what its developers are *actually* good at — reliably, continuously, without bias? Today's answers are all broken: **self-reported skills** are inflated and stale, **manager intuition** is subjective and political, and **productivity trackers** measure typing, not skill. So the biggest decisions — who builds what, who mentors whom, who's burning out — are made on **vibes and politics, not evidence**.

## Why Now (Motivation)

- **AI code-gen is a multiplier** → when everyone ships more code, *skill* differentiates people, yet self-reported skill is less reliable than ever.
- **Remote work killed the tacit signal** → the "ask Priya, she knows Kubernetes" knowledge graph is gone; a digital twin re-creates it *without surveillance*.
- **The org graph is the new resume** → influence inside a company predicts impact; PageRank finally has the data to measure it.

## Impact — What It Resolves

| Pain today | ADT delivers |
|:--|:--|
| Self-reported, stale skills | Live, evidence-backed profile updated every 5 min from real work |
| Task allocation is guesswork | Mathematically-ranked, *explainable* task↔developer fit |
| Bus-factor / silos invisible | Influence graph (PageRank) surfaces knowledge hubs & risks |
| Burnout noticed too late | Predictive burnout/velocity-decay scoring *before* it manifests |
| "Trust me, I'm senior" | Hardware-anchored, server-fused, audit-logged — tamper-resistant |

**Useful for:** enterprise staffing & promotions, consulting bench management, remote teams, hiring/onboarding, L&D and mentor-matching, academic cohorts.

## Core Objectives

1. **Allot the right task to the right developer** — by mathematical fit, not seniority.
2. **Audit, not surveil** — *"is this person growing as they claim?"* answered with evidence.

---

## How It Works (Workflow)

```
VS Code Extension ──hardware-anchored heartbeat every 30s──▶ API Gateway (:8000)
   │                                                              │
   │  raw counts only (WPM, keystrokes, files, snippets,         ├─ Auth      (hardware lock, identity)
   │  idle) — never a self-computed score                        ├─ Telemetry (5-min window aggregation)
   ▼                                                              ├─ Fusion    (the "brain" — see below)
Every 5 min the BatchProcessor aggregates raw pings →            ├─ THG       (Neo4j Neural Twin)
Fusion runs: fraud check → CodeBERT semantics → Bayesian         ├─ Allocation(task matching)
fuse → SHAP explanation → returns {reliability, skills} →        ├─ Analytics (burnout)
THG writes each skill (decay + blend) → audit_logs + live HUD    ├─ Monitoring(audit + real-time)
                                                                  └─ Task      (assessments, guardrails)
```
**If a batch fails the fraud gate, THG writes are skipped — bad data never reaches the Twin.** Dashboards read the Twin (with skill-decay applied live) to render skill radars, leaderboards, and allocation recommendations.

## The 10 Pillar Algorithms

| # | Algorithm | Does |
|:-:|:--|:--|
| 1 | **CodeBERT** | Embeds code → 8-domain skill probabilities (cosine vs centroids) |
| 2 | **SCM-Audit AST** | Structural signals (frameworks, file types) complement semantics |
| 3 | **SWEF-Ingestion** | Turns noisy 30s pings into meaningful 5-min windows |
| 4 | **SHA-HWID Anchor** | Cryptographically binds one extension to one machine |
| 5 | **BGSC-Feedback** | Caps how much any batch/assessment can move a score |
| 6 | **EVC-Influence** | PageRank over skill graph → finds knowledge hubs |
| 7 | **CSA-Matching** | Cosine task↔dev fit + Hungarian-optimal staffing |
| 8 | **VDA-Oversight** | Linear regression predicting burnout/velocity decay |
| 9 | **Async-Redis-WS** | Real-time pub/sub feeding the Live Audit HUD |
| 10 | **Native Cypher Fallback** | Graceful degradation when Neo4j GDS is unavailable |

*Supporting math:* **Bayesian fusion** (Beta distributions → strength + confidence), **Temporal decay** (`strength·e^(−0.1·days)`, ~7-day half-life), **SHAP** (deterministic "why did the score change").

---

## Why Three Databases (Polyglot Persistence)

The **shape of the data dictates the store** — each DB does only what it's best at:

- **MongoDB (documents)** — owns the **facts**: user profiles, the firehose of telemetry, batches, tasks, the append-only audit log. Chosen over SQL because the telemetry shape keeps **evolving** (no `ALTER TABLE`), it's a **write-heavy time-series** workload, the data is naturally **document-shaped** (nested signals), and 3 separate collections give **identity isolation**. Async via Motor; managed on Atlas.
- **Neo4j AuraDB (graph)** — owns the **Twin & relationships**: `Developer ─HAS_SKILL→ Skill`, `Manager ─MANAGES→ Developer`, `Task ─REQUIRES_SKILL→ Skill`. Chosen because relationships *are* the product: **PageRank influence** is a native graph algorithm (~200ms over 10k devs), multi-hop queries (squads, mentor-matching, task coverage) are cheap, and **decay-on-read** is a one-line Cypher. Doing this in Mongo would mean hand-rolling graph traversal.
- **Redis (in-memory)** — the **real-time nervous system**: sub-ms pub/sub (`audit:stream` → Live HUD) and ephemeral sessions with TTLs. Nothing here needs durability.

> **The split:** MongoDB holds the *facts* → Fusion turns them into *conclusions* → the conclusions become *skill edges in Neo4j* → the graph answers the ranking/relationship questions. One store for both would force either slow hand-rolled graph traversal or a graph DB choking on time-series writes.

## The THG Schema (the Neural Twin)

**Nodes:** `Developer`, `Skill` (8 domains), `Manager`, `Task`. **Edges:** `HAS_SKILL` (carries `strength`, `confidence`, `updated`, `prev_strength`), `MANAGES`, `ASSIGNED_TO`, `REQUIRES_SKILL`. The **only** place strength mutates is the decay-then-blend write: `new = (old·e^(−0.1·days) + incoming) · 0.5` — so one batch is "1 vote of 2," never a takeover. A *squad* is just developers `MANAGES`-linked to a manager (no redundant Squad node). Only the THG service writes to Neo4j.

---

## Reliability & Trust — Why the Data Can't Be Gamed

Trust is engineered in **layers** — *any one can be beaten; all of them together is the point.*

| "Can someone…" | Defense |
|:--|:--|
| …share/fake their telemetry source? | **SHA-HWID Anchor** locks one extension to one machine (server-side) |
| …run a typing bot? | **6-signal fraud gate** (keystroke padding, jitter, snippet variety, command ratio, idle, hours) → below threshold, **THG writes skipped + fraud_flag** |
| …self-report a favorable score? | **Impossible** — extension sends only raw counts; *all* scoring is server-side |
| …swing the score with one good/bad day? | **Bayesian fusion + BGSC delta caps + 50/50 decay-blend** neutralize outliers |
| …(a manager) inflate a junior? | **BGSC single-attempt assessments**, per-day caps, no direct THG edits (RBAC) |
| …tamper with the audit trail? | **Append-only**: no update/delete methods, insert-only DB role, hash-chain tamper-evidence |
| …be judged by a biased system? | **SHAP explains every change**; **confidence** is always reported; **fairness** of aggregation re-audited quarterly; **VDA is a suggestion, never an action** |

**Anti-bias & ethics by design:** developers can **pause, inspect, export, erase, and disconnect** their own data; burnout scores are shown to the *developer first*; ADT will **never** build per-keystroke manager graphs, idle alerts, or disciplinary auto-reports.

**Why you can trust the data, in one breath:** it comes from *real work*, is *hardware-anchored*, *fraud-gated*, *Bayesian-stabilized*, *computed server-side*, *append-only-audited*, *explainable*, and *consent-based*.

## Maturity (Honest Note)

The **architecture, schemas, security model, and deterministic logic** (decay, blend, cosine matching, hardware lock, audit logging, the full 9-service mesh) are **built and tested** — 97/97 backend + 29/29 extension tests passing, 58 endpoints covered. Several **ML-heavy pieces are specified with reference math but stubbed pending calibration** (anomaly detector, full Bayesian fuser, SCM-Audit parser, VDA). Accurate framing: **"a production-grade architecture with a calibration roadmap."**

---

### One-Slide Summary
- **What:** a live Neural Twin of every developer, built from real code.
- **Why:** capability is invisible & self-reported; every decision inherits that unreliability.
- **How:** VS Code extension → 9 microservices → 10 algorithms → Neo4j graph → decisions.
- **Trust:** hardware-anchored + server-fused + fraud-gated + Bayesian-stabilized + append-only-audited + SHAP-explainable + consent-based.
- **Vision:** engineering decisions grounded in **evidence, not politics**.
