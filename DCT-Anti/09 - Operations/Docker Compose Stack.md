---
tags: [operations, deployment]
---

# Docker Compose Stack

The repository utilizes a centralized `docker-compose.yml` to spin up the entire microservice architecture, including the Edge Gateway, all 9 microservices, and local instances of MongoDB, Neo4j, and Redis if cloud variables are not provided in the `.env` file.

## Topology Configuration (`docker-compose.yml`)

```yaml
version: '3.8'

services:
  gateway-service:
    build: ./backend/gateway
    ports:
      - "8000:8000"
    environment:
      - AUTH_SERVICE_URL=http://auth-service:8000
      - TELEMETRY_SERVICE_URL=http://telemetry-service:8000
      - TASK_SERVICE_URL=http://task-service:8000
      - ANALYTICS_SERVICE_URL=http://analytics-service:8000
      - FUSION_SERVICE_URL=http://fusion-service:8000
      - MONITORING_SERVICE_URL=http://monitoring-service:8000
      - THG_SERVICE_URL=http://thg-service:8000
      - ALLOCATION_ENGINE_URL=http://allocation-engine:8000

  auth-service:
    build: ./backend/auth
    environment:
      - MONGO_URL=mongodb://mongo:27017/adt
      - REDIS_URL=redis://redis:6379/0
      - THG_SERVICE_URL=http://thg-service:8000
```

## Key Networking Guidelines

- **Container Isolation**: Outbound host traffic must go through `gateway-service` on port `8000`.
- **Internal Ports**: Every microservice inside the docker network binds to internal port `8000`. They are mapped to sequential host ports (`8001`, `8002`, `8003`...) only for local debugging purposes.
- **Health Checks**: Standard Docker health probes query `/health` every 30 seconds to initiate self-healing.
