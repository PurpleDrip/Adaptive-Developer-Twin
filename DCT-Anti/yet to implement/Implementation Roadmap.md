---
tags: [roadmap, timeline]
---

# Implementation Roadmap & Punch List

Your step-by-step priority queue to achieve Tier-1 Level-100 status.

---

## 🔴 Priority 0: Critical Hardening (Sprint 1)

- [ ] **Task 1: Redis-backed Rate Limiter**
  - **File**: `backend/gateway/app/main.py`
  - **Details**: Integrate `slowapi` or custom Redis middleware to throttle `/login`, `/register`, and `/ingest` routes to a maximum of 5 attempts/minute per IP.
- [ ] **Task 2: Telemetry Nonce Handshake**
  - **File**: `backend/telemetry/app/routers/telemetry.py`
  - **Details**: Generate nonces on `/handshake`, save in Redis with 60s TTL, and require/invalidate them on `/ingest`.
- [ ] **Task 3: Backend Assessment Verification**
  - **File**: `backend/task/app/routers/assessment.py`
  - **Details**: Reject submissions if a database entry already exists for `(user_id, test_id)`.

---

## 🟡 Priority 1: Resiliency & Compliance (Sprint 2)

- [ ] **Task 1: Mongo Compound Indexes**
  - **File**: `shared/database/mongo.py`
  - **Details**: Add compound indices to the `telemetry_raw` collection: `db.telemetry_raw.createIndex({ extension_id: 1, timestamp: -1 })`.
- [ ] **Task 2: GDPR Erasure Endpoint**
  - **File**: `backend/auth/app/routers/admin.py`
  - **Details**: Build `POST /admin/user/{user_id}/erase` doing deep deletes across Mongo and Neo4j.
- [ ] **Task 3: Container Readiness Probes**
  - **File**: All microservices' Docker configurations
  - **Details**: Ensure containers do not accept traffic until DB clients report successful startup.

---

## 🔵 Priority 2: High Scale & Deployment (Sprint 3)

- [ ] **Task 1: Consistent Ingest Hashing**
  - **File**: `backend/gateway/app/main.py`
  - **Details**: Implement consistent hashing on Gateway proxies to direct telemetry from the same `extension_id` to the same backend pod.
- [ ] **Task 2: Redis Streams for Live Logs**
  - **File**: `backend/monitoring/app/routers/monitoring.py`
  - **Details**: Implement `XADD` to stream logs. Retrieve and backfill events to the frontend when connection drops.
- [ ] **Task 3: Kubernetes Deployment**
  - **File**: New directory `infra/helm/`
  - **Details**: Design complete Helm charts with dynamic replica scaling.
