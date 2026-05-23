---
tags: [roadmap, priority-0]
---

# P0 — Critical Blockers

These tasks represent high-risk security flaws and architecture blockages that must be addressed immediately.

## 1. Rate Limiting on API Gateway
- **Target File**: `backend/gateway/app/main.py`
- **Requirement**: Implement a Redis-backed rate limiter on registration and login endpoints. Limit users to 5 requests per minute.
- **Verification**: Execute `ab -n 10 -c 2 http://localhost:8000/api/v1/auth/users/login` and verify HTTP 429 is returned.

## 2. Hardened SHA-HWID Validation
- **Target File**: `extension/src/telemetry/collector.ts` & `backend/auth/app/routers/users.py`
- **Requirement**: Use a child process inside the extension to query native hardware metrics (Motherboard UUID) rather than depending solely on VS Code variables. Match on backend validation.
- **Verification**: Spoof `vscode.env.machineId` on client and confirm server rejects telemetry with HTTP 403.

## 3. Telemetry Nonce Ingestion
- **Target File**: `backend/telemetry/app/routers/telemetry.py`
- **Requirement**: Every `/handshake` call must generate a single-use crypto-nonce stored in Redis (TTL: 60s). The client must return the hash of this nonce in the `/ingest` request.
- **Verification**: Send sequential telemetry packets without changing nonces and verify `/ingest` returns 400 Bad Request.
