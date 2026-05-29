---
tags: [architecture]
aliases: [Topology, System Architecture]
---

# High-Level Topology

The big picture. Three planes:

1. **Edge plane** — what the developer interacts with (extension + web UI)
2. **Service plane** — the 9 microservices behind the gateway
3. **Truth plane** — the 3 data stores

```mermaid
flowchart TB
    subgraph Edge["Edge plane"]
        EXT["VS Code Extension<br/>(SHEC + SHA-HWID)"]
        WEB["Next.js Dashboard<br/>(Dev / PM / Tech)"]
    end

    GW["Gateway · :8000<br/>(CORS · proxy · timeout)"]

    subgraph Services["Service plane"]
        AUTH["Auth · :8001"]
        TEL["Telemetry · :8002"]
        FUS["Fusion · :8003"]
        THG["THG · :8004"]
        ALLOC["Allocation · :8005"]
        ANA["Analytics · :8006"]
        MON["Monitoring · :8007"]
        TASK["Task · :8008"]
    end

    subgraph Truth["Truth plane"]
        MONGO[("MongoDB Atlas<br/>users · managers · tech<br/>telemetry_raw / batches<br/>tasks · audit_logs")]
        NEO[("Neo4j AuraDB<br/>THG · Developer · Skill")]
        REDIS[("Redis · Upstash<br/>sessions · pub/sub")]
    end

    EXT --> GW
    WEB --> GW
    GW --> AUTH & TEL & FUS & THG & ALLOC & ANA & MON & TASK

    AUTH <--> MONGO
    AUTH <--> REDIS
    TEL <--> MONGO
    TEL --> FUS
    FUS --> THG
    THG <--> NEO
    ALLOC --> THG
    ALLOC --> FUS
    ANA --> THG
    MON <--> MONGO
    MON <--> REDIS

    style Edge fill:#1e3a8a22,stroke:#1e3a8a
    style Services fill:#7c3aed22,stroke:#7c3aed
    style Truth fill:#05966922,stroke:#059669
```

## Key invariants

1. **Nothing talks to a DB except its owner service.** Telemetry doesn't read THG; THG doesn't read Mongo. If a service needs another's data, it calls that service's API.
2. **All cross-service calls go via service URLs**, never via the gateway. The gateway is for browsers and the extension. Internal services use `*_URL` env vars set in [[09 - Operations/Docker Compose Stack]].
3. **The gateway is stateless.** No DB, no session, no in-memory cache. Kill and restart at will.
4. **All persistence happens in the Truth plane.** No service uses local disk except cache.

## Why microservices?

- **Independent scaling** — telemetry ingest gets hammered; auth doesn't.
- **Failure isolation** — Fusion can be down for 5 min without losing telemetry; batches catch up.
- **Polyglot persistence** — Mongo for raw documents, Neo4j for relationships, Redis for ephemeral state. One service owns each store.

## Trade-offs we accept

- **Operational complexity** — 9 services is a lot for a small team. Mitigation: [[09 - Operations/Docker Compose Stack]] makes local dev one command.
- **Distributed-system bugs** — partial failures, retry storms. Mitigation: [[07 - Algorithms/Async-Redis-WS]] for non-blocking event flow, idempotent writes.
- **Latency** — extra hops vs. monolith. Mitigation: telemetry ingest path is the only one that must be fast; everything else can be async.

## Next

- [[Microservice Map]] — every box, fully labeled
- [[Service Communication Matrix]] — every arrow, fully tabulated
- [[Data Flow - End to End]] — what one developer's day looks like in the system
