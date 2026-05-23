---
tags: [overview]
status: living-document
---

# Roadmap

> Tied to [[13 - Yet to Implement/_MOC]]. Items here are *themes*, not tasks.

## Now (current sprint)

- **Simulation Mode** — investor-demo with embedded IDE → live pipeline → dashboard. See [[11 - Simulation Mode/_MOC]].
- **P0 security gaps** — see [[13 - Yet to Implement/P0 - Critical Blockers]].

## Next (this quarter)

- **Real Fusion ML pipeline** — replace stubs in `backend/fusion/app/services/{anomaly_detector,normalizer,weight_engine,bayesian_fusion,online_learner,project_analyzer}.py` with real implementations.
- **Observability** — OTEL + Prometheus + Grafana dashboards.
- **GDPR right-to-erase** — Mongo + Neo4j + Redis flow with reversibility audit.

## Later (next 2 quarters)

- **K8s migration** — out of docker-compose, into Helm charts.
- **Multi-tenant** — single deployment, multiple orgs, isolated by tenant_id at every layer.
- **Mobile companion app** — read-only Twin viewer.

## Definitely not on the roadmap

- Selling per-developer data externally
- Disciplinary auto-reports to HR without dev awareness
- Built-in chat or messaging (out of scope)
