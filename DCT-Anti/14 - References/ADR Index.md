---
tags: [references, adr]
---

# ADR Index (Architecture Decision Records)

A catalog of major architectural design decisions made for ADT.

- **[[Tech Decisions Log#Neo4j Selection|ADR-001: Graph-Native Architecture (Neo4j)]]** — Decided to map developer skill trees using Neo4j relationships rather than flat SQL indices.
- **[[Tech Decisions Log#Polymorphic Collections|ADR-002: Polymorphic DB Silos for RBAC]]** — Replaced role attributes with distinct physical collections to bypass role escalation attacks.
- **[[Tech Decisions Log#Upstash Redis|ADR-003: Redis In-Memory Hub for Realtime WS]]** — Selected Redis Pub/Sub for fast, non-blocking WS message distribution.
