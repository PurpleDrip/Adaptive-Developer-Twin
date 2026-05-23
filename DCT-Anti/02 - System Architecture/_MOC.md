---
tags: [moc]
---

# 02 — System Architecture · Map of Content

How ADT is wired together. Every box and arrow.

## Topology

- [[High-Level Topology]] — the 10,000-ft view
- [[Microservice Map]] — service boxes + edges
- [[Service Communication Matrix]] — who calls whom
- [[Networking & Ports]] — port table + DNS conventions
- [[Deployment Topology]] — docker-compose today, K8s tomorrow
- [[Persistence Layer]] — Mongo + Neo4j + Redis layout
- [[Realtime Layer (Redis Pub Sub)]] — pub/sub channels + WS endpoints

## Data flows

- [[Data Flow - End to End]] — registration → telemetry → fusion → dashboard
- [[Data Flow - Registration]] — sign up → THG node → first ext_id
- [[Data Flow - Telemetry Pipeline]] — extension → ingest → batch → fusion → THG
- [[Data Flow - Skill Update]] — fusion result → THG mutation → audit
- [[Data Flow - Task Allocation]] — task created → CSA rank → assign

## Sequence diagrams

- [[Sequence - Live Audit HUD]] — Async-Redis-WS realtime stream

## Related

- [[03 - Microservices/_MOC]] — service-by-service detail
- [[06 - Data Models/_MOC]] — the schemas behind the boxes
- [[07 - Algorithms/_MOC]] — the algorithms inside the boxes
