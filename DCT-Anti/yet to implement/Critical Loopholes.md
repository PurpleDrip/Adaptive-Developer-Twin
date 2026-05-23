---
tags: [security, audit, loops]
---

# Critical Loopholes & Architectural Flaws

This document details the major vulnerabilities discovered in the ADT-v1 codebase. Solve these first to harden the platform.

---

## 1. The Telemetry Replay Exploit
- **Vulnerability**: The route `/api/v1/telemetry/ingest` accepts JSON payloads without validating time limits, timestamps, or request nonces.
- **Attack Vector**: A developer can open their terminal and run a simple cURL script POSTing a captured, valid `extension_id` and WPM payload every 500ms. The server accepts all packets, resulting in an artificial "100% Focus" score and inflating their digital twin parameters.
- **Tier-1 Solution**:
  - Introduce **Telemetry Nonce Ingestion**. 
  - Every client heartbeat `/handshake` must receive a unique cryptographically signed nonce valid for exactly 45 seconds.
  - The client must include the hashed nonce inside the `/ingest` payload.
  - The server invalidates the nonce upon successful write.

---

## 2. Insecure Hardware Identification
- **Vulnerability**: The VS Code extension retrieves the machine ID via `vscode.env.machineId`.
- **Attack Vector**: This variable is an editor-level configuration that can be spoofed by overriding environment variables or running VS Code inside containerized profiles. An engineer can bypass their hardware lock and run telemetry on multiple machines.
- **Tier-1 Solution**:
  - Incorporate the native `node-machine-id` package or run a shell command via `child_process` to extract the host motherboard UUID and CPU fingerprint directly from the OS.
  - Combine these metrics in the client: `SHA256(extension_id + "_" + motherboard_uuid + "_" + cpu_id)`.

---

## 3. UI-Only Assessment Locks
- **Vulnerability**: Developers are restricted to a single attempt on weekly assessments, but this limit is only enforced in the Next.js frontend UI (`/dashboard`).
- **Attack Vector**: A developer can capture the POST request for test submissions using Postman or browser DevTools and replay it with different answers, brute-forcing a perfect test score directly via the API.
- **Tier-1 Solution**:
  - Implement a backend verification database filter inside the Task service.
  - In `backend/task/app/routers/assessment.py`, the `/submit` endpoint must perform an immediate Mongo query on `weekly_tests` to check if a submission already exists for the combination of `(user_id, assessment_id)`.
  - If a record is found, immediately return `403 Forbidden`.

---

## 4. Wildcard CORS Configuration
- **Vulnerability**: Every backend microservice (Auth, Telemetry, Fusion, Monitoring) implements FastAPI CORS middleware with `allow_origins=["*"]`.
- **Attack Vector**: Cross-origin requests can bypass edge constraints if an attacker targets internal service ports directly.
- **Tier-1 Solution**:
  - Restrict CORS on all internal microservices to accept requests *only* from the API Gateway service URL (`http://gateway-service:8000`) and the whitelisted Next.js frontend domains.
