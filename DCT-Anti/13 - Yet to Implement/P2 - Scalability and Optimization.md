---
tags: [roadmap, priority-2]
---

# P2 — Scalability and Optimization

Tasks mapping the transition of ADT to supporting massive enterprise deployments (10k+ active developers).

## 1. Kubernetes Infrastructure Migration
- **Target Files**: `[NEW]` Helm Chart templates under `infra/helm/`
- **Requirement**: Create scalable manifests, ingress configurations, horizontal pod autoscalers, and persistent volume claims for data nodes.
- **Verification**: Execute `helm install adt ./infra/helm/ --dry-run` and verify validity.

## 2. Telemetry Sticky-Session Load Balancing
- **Target File**: `backend/gateway/app/main.py`
- **Requirement**: Re-route incoming extension telemetry requests dynamically based on `extension_id` consistent hashes to maximize cache hits.
- **Verification**: Check telemetry server access logs, confirm consistent pod targeting for individual IDs.

## 3. Redis Streams for Audit Log Replays
- **Target File**: `shared/services/audit_logger.py` & `backend/monitoring/app/main.py`
- **Requirement**: Upgrade standard Redis pub/sub to Redis Streams (`XADD`) to support live log history replays when a user opens the Live Audit HUD.
- **Verification**: Connect to WS and request backfill of last 50 entries using stream offset parameters.
