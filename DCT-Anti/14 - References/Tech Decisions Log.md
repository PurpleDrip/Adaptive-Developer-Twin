---
tags: [references, decisions]
---

# Tech Decisions Log

## Neo4j Selection
### Context:
We require the system to map skills dynamically. Skills propagate to neighboring nodes (e.g., mastering `React` increases affinity for `Typescript` and `Frontend`). Managing this in relational tables requires endless self-joins, leading to severe query degradation.

### Decision:
Use Neo4j. Represents skill relationships natively as edges (`HAS_SKILL`, `REQUIRES_SKILL`). This enables out-of-the-box usage of the Neo4j Graph Data Science (GDS) library to run **EVC PageRank Centrality** to find organizational knowledge hubs instantly.

---

## Polymorphic Collections
### Context:
Standard JWT metadata validation is susceptible to privilege escalation exploits. If a developer compromises their local token properties or inputs custom query parameters, they might gain admin privileges.

### Decision:
Partition data physically into three MongoDB collections (`users`, `managers`, `tech_staff`). A query to whitelisted users can never access tech_staff details, securing our zero-trust perimeter at the database layer.

---

## Upstash Redis
### Context:
Streaming live telemetry data to Admin HUDs requires high throughput and minimal latency. Running loops directly over MongoDB indices adds excessive write/read stress on primary database engines.

### Decision:
Deploy Upstash Redis. Ephemeral WebSocket pub/sub streams use Redis memory channels. The primary database is completely bypassable on frontend rendering, maintaining clean, responsive dashboards.
