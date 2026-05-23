---
tags: [moc, home, root]
aliases: [Home, Index, DCT Vault]
created: 2026-05-24
status: living-document
---

# 🧠 ADT / DCT — Master Vault

> **Adaptive Developer Capability Twin (DCT)** — a Neural Twin of every developer in the org, fusing semantic code analysis, hardware-anchored telemetry, and graph analytics into a tamper-proof source of truth for skill, influence, and task allocation.

This vault is the **living source of truth** for the ADT-v1 platform. It is consumed by humans **and** AI agents. Treat it like code: link generously, keep notes atomic, never duplicate facts — link to them.

---

## 🗺️ Maps of Content (Start Here)

| # | Section | What you'll find |
|:-:|:--------|:------------------|
| 01 | [[01 - Overview/_MOC\|Overview]] | What ADT is, the 10 pillar algorithms, vision, stakeholders, Tier-1 bar |
| 02 | [[02 - System Architecture/_MOC\|System Architecture]] | Topology, sequence diagrams, data flows, networking, deployment |
| 03 | [[03 - Microservices/_MOC\|Microservices]] | All 9 services — routes, models, DBs, env, dependencies |
| 04 | [[04 - VS Code Extension/_MOC\|VS Code Extension]] | Telemetry collector, snapshotter, SHEC protocol, hardware lock |
| 05 | [[05 - Frontends/_MOC\|Frontends]] | Next.js dashboards, legacy Vite app, routes, components |
| 06 | [[06 - Data Models/_MOC\|Data Models]] | Mongo collections, Neo4j (THG) graph, Redis keys, DTOs |
| 07 | [[07 - Algorithms/_MOC\|Algorithms]] | CodeBERT, SCM-Audit, SWEF, SHA-HWID, BGSC, EVC, CSA, VDA, Bayesian fusion, SHAP |
| 08 | [[08 - Security & Compliance/_MOC\|Security & Compliance]] | Threat model, RBAC, PII, OWASP, GDPR/SOC2/ISO posture |
| 09 | [[09 - Operations/_MOC\|Operations]] | Docker, runbooks, CI/CD, observability, SLOs, on-call |
| 10 | [[10 - UX & UI/_MOC\|UX & UI]] | Design tokens, layouts per role, motion, a11y, microcopy |
| 11 | [[11 - Simulation Mode/_MOC\|Simulation Mode]] | Investor-demo mode: embedded IDE → live pipeline → dashboard |
| 12 | [[12 - Expert Review/_MOC\|Expert Review]] | Ranked risks, loopholes, anti-patterns, Tier-1 gap analysis |
| 13 | [[13 - Yet to Implement/_MOC\|Yet to Implement]] | Agent-actionable punch list — P0/P1/P2 priorities |
| 14 | [[14 - References/_MOC\|References]] | ADRs, tech-decision log, external links, reading list |

---

## 🧭 Vault Meta

- [[_meta/Glossary|Glossary]] — every ADT-specific term, defined
- [[_meta/Tag Dictionary|Tag Dictionary]] — when to use each tag
- [[_meta/Linking Conventions|Linking Conventions]] — how to link notes
- [[_meta/Vault Map|Vault Map]] — visual folder structure
- [[_meta/Agent Collaboration Protocol|Agent Collaboration Protocol]] — how AI agents should read & update this vault
- [[_meta/Changelog|Changelog]] — what changed and when

---

## 🎯 Tier-1 Production Bar

The bar for shipping this as a **tier-1 production enterprise system**:

- **Zero PII leaks** — telemetry never carries unredacted secrets
- **Zero unbounded queues** — every consumer has backpressure
- **p99 ingest < 200 ms** at 10k devs simultaneously
- **99.9 % monthly uptime** of the ingest path; 99.95 % for auth
- **Full audit trail** — every skill mutation traceable to a batch_id
- **Reproducible deploys** — every commit yields the same container hash
- **Single-attempt assessments cryptographically enforced** (not UI-enforced)
- **Sub-5-minute incident detection** via SLO-based alerting

See [[01 - Overview/Tier-1 Production Bar|Tier-1 Production Bar]] for the full checklist and [[12 - Expert Review/Tier-1 Production Gap Analysis|Gap Analysis]] for where we are today.

---

## 🔥 Quick Links for Agents

If you're an agent picking up work, **read these in order**:

1. [[_meta/Agent Collaboration Protocol]] — the rules of the road
2. [[13 - Yet to Implement/README - For Agents|Yet-To-Implement README]] — open work, with priorities + acceptance criteria
3. [[02 - System Architecture/High-Level Topology|High-Level Topology]] — what the system looks like
4. [[03 - Microservices/_MOC]] — the service you're touching
5. [[12 - Expert Review/Top Risks (Ranked)|Top Risks]] — what NOT to break

---

## 🏛️ The 10 Pillar Algorithms (at a glance)

| # | Name | Service | One-line |
|:-:|:-----|:--------|:---------|
| 1 | [[07 - Algorithms/CodeBERT Pipeline\|CodeBERT]] | Fusion | Semantic code intent via transformer embeddings |
| 2 | [[07 - Algorithms/SCM-Audit AST\|SCM-Audit]] | Fusion | AST-driven skill taxonomy mapping |
| 3 | [[07 - Algorithms/SWEF-Ingestion (Sliding Window)\|SWEF-Ingestion]] | Telemetry | Sliding-window aggregation of raw streams |
| 4 | [[07 - Algorithms/SHA-HWID Anchor\|SHA-HWID]] | Auth | Crypto lock: extension_id ↔ machine |
| 5 | [[07 - Algorithms/BGSC Feedback\|BGSC]] | Task | Skill growth guardrails via verified assessment |
| 6 | [[07 - Algorithms/EVC-Influence (PageRank)\|EVC-Influence]] | THG | PageRank to find knowledge hubs |
| 7 | [[07 - Algorithms/CSA-Matching\|CSA-Matching]] | Task | Cosine-similarity dev↔task vector matching |
| 8 | [[07 - Algorithms/VDA-Oversight\|VDA-Oversight]] | Analytics | Linear-regression burnout/velocity decay |
| 9 | [[07 - Algorithms/Async-Redis-WS\|Async-Redis-WS]] | Monitoring | Non-blocking realtime audit HUD |
| 10 | [[07 - Algorithms/Native Cypher Fallback\|Native Cypher]] | THG | Resilient graph queries when GDS is down |

---

## 📜 Status

- **Vault Level:** Level-100 (target — see [[_meta/Changelog]] for current)
- **Project Phase:** Pre-Tier-1 hardening (see [[12 - Expert Review/Tier-1 Production Gap Analysis]])
- **Last Major Update:** 2026-05-24 — full vault rebuild
- **Maintainers:** Project core team + designated AI agents (see [[_meta/Agent Collaboration Protocol]])
