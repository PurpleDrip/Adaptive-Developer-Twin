---
tags: [meta, tag-dictionary, reference]
---

# Tag Dictionary

> Tags are queryable. Use these exactly. Don't invent new tags without adding them here.

## Structural

- `#moc` — Map of Content (folder index)
- `#home` — The root home page
- `#meta` — Vault-about-the-vault docs
- `#reference` — External pointers, ADRs, links

## Domain

- `#service` — A backend microservice doc
- `#algorithm` — A pillar algorithm or core model
- `#dto` — A data transfer object schema
- `#schema-mongo` — Mongo collection schema
- `#schema-neo4j` — Neo4j graph element schema
- `#schema-redis` — Redis key/channel schema
- `#frontend` — Anything Next.js or legacy Vite
- `#extension` — VS Code extension
- `#endpoint` — A REST endpoint or WebSocket route

## Concerns

- `#security` — Security-relevant content
- `#privacy` — PII / consent / GDPR-flavored content
- `#performance` — Latency, throughput, scale
- `#reliability` — Uptime, failure modes, retries
- `#observability` — Logging, tracing, metrics
- `#ux` — UI / UX design content
- `#a11y` — Accessibility
- `#compliance` — Regulatory: GDPR, SOC2, ISO27001

## Work State

- `#yet-to-implement` — Action item; agent-actionable
- `#p0` — Critical blocker (production cannot ship)
- `#p1` — Production-readiness gap
- `#p2` — Polish / hardening
- `#in-progress` — Someone is actively on this
- `#done` — Implemented and verified
- `#blocked` — Waiting on external decision

## Risk

- `#risk-security`, `#risk-data-loss`, `#risk-pii`, `#risk-scale`, `#risk-vendor-lockin`, `#risk-cost`

## Mode-specific

- `#simulation-mode` — Investor-demo mode artifacts
- `#real-mode` — Production-only logic
- `#mode-agnostic` — Works in both
