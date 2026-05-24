---
tags: [reliability]
---

# Ports & Service Map

See [[03 - Microservices/Service Health & Ports]] — that's the canonical reference. This note exists for cross-linking from operations runbooks.

Quick view:

```
8000  Gateway          /health
8001  Auth             /api/v1/auth/health
8002  Telemetry        /api/v1/telemetry/health
8003  Fusion           /api/v1/fusion/health
8004  THG              /api/v1/thg/health
8005  Allocation       /api/v1/allocation/health
8006  Analytics        /api/v1/analytics/health
8007  Monitoring       /api/v1/monitoring/health
8008  Task             /api/v1/task/health
3000  Next.js dev
5173  Legacy Vite dev (deprecated)
```

`curl http://localhost:8000/health` should return `{"status":"ok"}`.

`curl http://localhost:8007/api/v1/monitoring/system-health` returns the rollup.
