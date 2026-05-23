---
tags: [roadmap, priority-1]
---

# P1 — Essential Hardening

Necessary hardening of performance, resilience, and compliance interfaces.

## 1. Container Liveness & Readiness Probes
- **Target File**: All microservices' Dockerfiles & `docker-compose.yml`
- **Requirement**: Integrate `/ready` check endpoint ensuring Mongo and Neo4j connections are active before container is designated ready.
- **Verification**: Query container state via Docker inspect.

## 2. Compound Index Configuration in MongoDB
- **Target File**: `shared/database/mongo.py`
- **Requirement**: Configure compound indexes on `telemetry_raw` on keys `(extension_id, timestamp)` to speed up BatchProcessor fetches.
- **Verification**: Run `db.telemetry_raw.getIndexes()` in MongoDB database explorer.

## 3. GDPR Cascading Erase Endpoint
- **Target File**: `backend/auth/app/routers/admin.py`
- **Requirement**: Create route `POST /admin/user/{user_id}/erase`. Trigger sequential deletions from Mongo `users`, `whitelist`, and Cypher calls to Neo4j.
- **Verification**: Run query against target user, verify 0 rows are returned across all three layers.
