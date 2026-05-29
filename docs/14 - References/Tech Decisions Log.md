---
tags: [reference]
---

# Tech Decisions Log

> Quick rationales for non-obvious tech choices. For formal records, see [[ADRs (Architecture Decision Records)]].

| Decision | Picked | Alternatives | Why |
|:---------|:-------|:-------------|:----|
| Backend language | Python 3.11 | Go, Rust | FastAPI ergonomics + ML lib ecosystem (transformers) |
| Document store | MongoDB | Postgres | Flexible telemetry shape; async driver maturity (motor) |
| Graph store | Neo4j | RedisGraph, Memgraph | Cypher + GDS ecosystem |
| Realtime | Redis pub/sub | Kafka, Pulsar | Cheap, low-latency, fits the live-HUD use case |
| Frontend | Next.js App Router | Remix, SvelteKit | RSC for role gating; large ecosystem |
| Editor | Monaco | CodeMirror 6 | Same as VS Code (visual authenticity for Sim Mode) |
| Charts | Recharts | Highcharts, Victory | Sufficient + free + SSR-friendly |
| ML brain | CodeBERT centroids | Fine-tuned classifier, LLM-per-snippet | No labels needed; deterministic; fast |
| Confidence math | Bayesian Beta | Naive averaging, EWMA | Closed-form posterior + natural confidence |
| Decay | Exponential `λ=0.1` | Linear, step | Smooth + half-life-intuitive |
| Anomaly composition | Weighted geometric mean | Arithmetic mean, OR | Penalizes worst signal |
| Auth identity | 3 collections (silo) | 1 collection w/ role field | Privilege escalation by mutation is structurally impossible |
| Session | JWT + refresh (target) | Stateful sessions | Stateless services scale better |
| Snapshot upload | Signed URL → S3 | Base64 in body | Avoids API memory pressure + SSRF |
| Audit fanout | Redis pub/sub + Mongo | Kafka, Redis Streams | At-most-once real-time; durable in Mongo for backfill |
| Hungarian impl | scipy | Custom | Battle-tested |
| Hardware lock | `vscode.env.machineId` (+ optional node-machine-id) | Pure node-machine-id | VS Code ID is enough for "same install on same OS" |

## Decisions to revisit

| Topic | When |
|:------|:-----|
| Kafka for telemetry | At 100k devs (or when batch lag becomes routine) |
| K8s migration | When we need rolling deploy + HPA |
| Fine-tuned classifier vs centroids | Once we have 10k+ labeled snippets |
| Refresh tokens lifetime | Customer feedback on session expiry UX |
| Sliding vs tumbling window | If smoother dashboard trends are requested |
