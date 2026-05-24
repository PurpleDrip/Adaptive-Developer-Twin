---
tags: [reference]
---

# ADRs — Architecture Decision Records

> Formal records of major decisions. Format adapted from Michael Nygard. Each ADR is **immutable** — supersede by a new ADR.

## Index

| # | Title | Status |
|:-:|:------|:-------|
| 001 | 9 microservices vs monolith | Accepted |
| 002 | Polyglot persistence: Mongo + Neo4j + Redis | Accepted |
| 003 | CodeBERT centroids over fine-tuned classifier (v1) | Accepted |
| 004 | Identity isolation via three Mongo collections | Accepted |
| 005 | Read-time decay vs background re-compute | Accepted |
| 006 | Sim Mode as a tenant flag, not a separate stack | Accepted |
| 007 | JWT + opaque refresh in httpOnly cookie | Proposed |
| 008 | Pillar names internal vs marketing | Accepted |
| 009 | Bayesian Beta for skill confidence | Accepted |
| 010 | Audit log is durable; pub/sub is best-effort | Accepted |

## ADR template

```
# ADR-NNN — <Title>

## Context
Why this needed a decision.

## Decision
What we picked.

## Consequences
Positive, negative, neutral.

## Alternatives considered
Brief.

## Status
Proposed / Accepted / Deprecated / Superseded by ADR-XXX

## Date
YYYY-MM-DD
```

## Where to store full ADRs

`docs/adrs/NNN-<slug>.md`. Reference from this index when written.

> Currently only the index exists. Tracked: write up the actual ADRs as the architecture stabilizes.
