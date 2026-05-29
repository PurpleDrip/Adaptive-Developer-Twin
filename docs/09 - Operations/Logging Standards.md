---
tags: [observability]
---

# Logging Standards

## Format

JSON, one line per event:

```json
{
  "ts": "2026-05-24T12:04:17.234Z",
  "lvl": "INFO",
  "svc": "telemetry",
  "msg": "batch processed",
  "request_id": "abc123",
  "user_id": "u-1234",
  "batch_id": "BATCH-...",
  "duration_ms": 412,
  "extra": { ... }
}
```

Use `python-json-logger` or `structlog` with a custom processor.

## Required fields per entry

- `ts` — ISO 8601 UTC
- `lvl` — DEBUG / INFO / WARN / ERROR
- `svc` — service name (canonical: `auth`, `telemetry`, etc.)
- `msg` — short human description
- `request_id` — propagated `X-Request-ID`

## Conventions

| Don't | Do |
|:------|:---|
| `print()` | `log.info(...)` |
| `log.info(f"user {email} logged in")` (PII!) | `log.info("user logged in", extra={"user_id": uid})` |
| `log.error(str(e))` (lossy) | `log.exception("operation failed")` (preserves stack) |
| `log.info("ok")` (uninformative) | `log.info("ingest received", extra={"sync_type": ..., "bytes": ...})` |
| Multi-line tracebacks via `print(traceback.format_exc())` | `log.exception(...)` (one JSON entry per traceback) |

## Levels

| Level | Use for |
|:------|:--------|
| `DEBUG` | per-loop iteration, dev-only |
| `INFO` | normal operations, audit-relevant |
| `WARN` | unexpected but recoverable |
| `ERROR` | request-level failure (5xx); caught exceptions |
| `CRITICAL` | service-level failure (startup, DB unreachable) |

## What MUST NOT go in logs

- Plaintext password
- bcrypt hash
- JWT (full token)
- API keys, even partial (last 4 chars OK)
- Email address (use user_id)
- Code snippets from telemetry
- Workspace snapshot contents

## Sampling

For high-volume INFO logs (e.g., `/ingest` success), sample at 1% in prod. Always log 100% of WARN+.

## Code skeleton

```python
import logging, structlog
log = structlog.get_logger("telemetry")

@router.post("/ingest")
async def ingest(dto: TelemetryIngestDTO, request: Request):
    rid = request.headers.get("X-Request-ID", uuid4().hex)
    bound = log.bind(request_id=rid, extension_id=dto.extension_id)
    bound.info("ingest received", sync_type=dto.sync_type)
    try:
        ...
        bound.info("ingest stored", duration_ms=duration_ms)
        return {"status": "ingested"}
    except Exception:
        bound.exception("ingest failed")
        raise
```

Tracked: [[13 - Yet to Implement/Backend - All - Structured Logs + TraceID]].
