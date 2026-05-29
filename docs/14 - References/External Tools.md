---
tags: [reference]
---

# External Tools

What we build on, with rationale.

## Runtime

| Tool | Why |
|:-----|:----|
| Python 3.11+ | Async-mature, typed; FastAPI ergonomics |
| FastAPI | Pydantic v2 + async + OpenAPI for free |
| Node 18+ / TypeScript | Frontend + extension |
| Next.js 16 (App Router) | RSC, streaming, role-gated layouts |
| Tailwind | Token-driven CSS |

## Data

| Tool | Why |
|:-----|:----|
| MongoDB Atlas | Async drivers, flexible schema, time-series-friendly |
| Neo4j AuraDB | Native graph queries, decay-on-read trivial |
| Redis (Upstash) | Sub-ms pub/sub + sessions |
| (planned) Kafka or Kinesis | At-scale telemetry buffering |

## AI / ML

| Tool | Why |
|:-----|:----|
| transformers (Hugging Face) | CodeBERT model loader |
| microsoft/codebert-base | Pretrained code embeddings |
| scipy | Hungarian Algorithm |
| (planned) Triton | GPU inference server |
| (planned) SHAP | True Shapley attribution (for now we use a simplified version) |

## Frontend

| Tool | Why |
|:-----|:----|
| recharts | Sufficient for radar, sparklines, bars |
| xyflow | Graph viz (influence, pipeline) |
| Monaco editor | Sim Mode embedded IDE |
| Radix UI | Accessible primitives |
| lucide-react | Icon set |

## Extension

| Tool | Why |
|:-----|:----|
| axios | HTTP client |
| adm-zip | Snapshot zipping |
| node-machine-id | Native HW UUID (P2) |

## Infrastructure (target)

| Tool | Why |
|:-----|:----|
| Kubernetes | Autoscale, rolling deploy |
| Helm | Templated charts |
| NGINX / Envoy | Edge proxy |
| cert-manager | Cert automation |
| HashiCorp Vault (or AWS SM) | Secrets |
| Prometheus + Grafana | Metrics |
| Tempo / Jaeger | Traces |
| Loki / CloudWatch | Logs |
| OpenTelemetry | Instrumentation standard |
| Sigstore + cosign | Container signing |
| Trivy | Container scanning |
| gitleaks + detect-secrets | Secret scanning |

## CI/CD (target)

| Tool | Why |
|:-----|:----|
| GitHub Actions | Default for now |
| testcontainers | Integration test infra |
| k6 (or Locust) | Load testing |
| Pact (or schema-diff) | Contract testing |

See [[Tech Decisions Log]] for the rationale of each non-obvious pick.
