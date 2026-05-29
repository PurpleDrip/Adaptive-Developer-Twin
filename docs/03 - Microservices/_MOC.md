---
tags: [moc, service]
---

# 03 — Microservices · Map of Content

Per-service deep dive. Each page is a complete reference for one service.

## Services

| Port | Service | Status |
|:----:|:--------|:-------|
| 8000 | [[Gateway Service]] | living |
| 8001 | [[Auth Service]] | living |
| 8002 | [[Telemetry Service]] | living |
| 8003 | [[Fusion Service]] | living — many stubs |
| 8004 | [[THG Service]] | living |
| 8005 | [[Allocation Service]] | living |
| 8006 | [[Analytics Service]] | partial — most routers stubbed |
| 8007 | [[Monitoring Service]] | living |
| 8008 | [[Task Service]] | partial — assessment stubbed |

## Service page template

Each note follows the same structure:

1. **Identity** — port, container name, code path
2. **Responsibilities** — what this service owns
3. **Routes** — table of method · path · handler · purpose
4. **Models / DTOs** — Pydantic schemas
5. **Services / Business logic** — classes and modules
6. **Database** — collections/nodes used + indexes touched
7. **Env vars** — required + optional
8. **Outbound calls** — what this service depends on
9. **Background tasks** — schedulers, workers
10. **Known gaps** — links to [[12 - Expert Review/_MOC]] and [[13 - Yet to Implement/_MOC]]

See [[Service Health & Ports]] for the consolidated port table.
