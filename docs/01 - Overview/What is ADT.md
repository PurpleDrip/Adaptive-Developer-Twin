---
tags: [overview]
aliases: [ADT, Adaptive Developer Twin, DCT]
status: living-document
---

# What is ADT?

**ADT (Adaptive Developer Twin)** is an *Engineering Intelligence System* that builds a **Neural Twin** — a [[_meta/Glossary#D|DCT]] — for every developer in an organization.

Each Twin is a live, tamper-resistant model of:

- **Skill strength** per domain (backend, frontend, devops, ml, db, security, testing, neo4j)
- **Skill confidence** — how *sure* the system is about each strength
- **Influence** — graph-based centrality in the org's knowledge network
- **Velocity & burnout risk** — derived from telemetry windows

The Twin is built by fusing:

1. **Semantic code analysis** — what the developer actually wrote (CodeBERT)
2. **Hardware-anchored telemetry** — what their IDE recorded (with anti-spoofing)
3. **Graph analytics** — how their skills connect and propagate in the org

---

## Two purposes (the user's framing)

1. **Allot the right task to the right developer.**
   The Allocation Engine consumes the THG (Talent Graph) and ranks candidates by mathematical fit.

2. **Monitor the developer.**
   Not surveillance — *audit*. We answer "is this person growing in the directions they claim?" with evidence, not vibes.

## Who uses it?

| Role | What they do here | Where they live |
|:-----|:------------------|:----------------|
| **Developer** | Watches their Twin grow; takes verified assessments; sees their org rank | [[10 - UX & UI/Dashboard Layouts - Developer\|/dashboard]] |
| **Project Manager** | Orchestrates squads; uses Candidate Vector Matching for assignments | [[10 - UX & UI/Dashboard Layouts - PM\|/project-manager]] |
| **Tech Admin** | Operates the system; monitors the audit log; tunes config | [[10 - UX & UI/Dashboard Layouts - Tech Admin\|/tech]] |
| **HRM / Senior Manager** | Cross-squad analytics, hiring decisions | [[10 - UX & UI/Dashboard Layouts - PM]] (extended view) |

## Why is it reliable?

Three pillars of reliability:

1. **Hardware Anchoring** — every telemetry packet is signed by a hardware-bound extension. See [[07 - Algorithms/SHA-HWID Anchor]].
2. **Server-side fusion** — all behavioral analysis runs in the backend "black box." Developers can't tamper with their own scores.
3. **Identity isolation** — managers, developers, and tech staff live in separate Mongo collections. Role escalation is *physically impossible* without DB-level access.

See [[Zero-Trust Security Perimeter]] for the full posture.

## Anti-claims

ADT is **not**:

- A keystroke-keyboard productivity-tracker for HR to punish slow typers.
- A code-quality linter or static analyzer.
- A code-review tool.
- A surveillance product. Telemetry windows are configurable per-org and the developer always sees their own data.

## In one sentence

> ADT is a hardware-anchored, server-fused, graph-native skill-truth-source for engineering organizations that have outgrown self-reported expertise.

---

## Next

- [[Vision & Mission]] — the longer thesis
- [[02 - System Architecture/High-Level Topology]] — how the pieces fit
- [[10 Pillar Algorithms]] — the proprietary stack
