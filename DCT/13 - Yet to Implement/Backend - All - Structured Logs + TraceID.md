---
tags: [yet-to-implement, p1, observability]
status: pending
priority: P1
estimate: 3 days
---

# Backend — All — Structured Logs + Trace ID

## Why
Today: free-form text via `print()` / bare `logging`. No trace IDs. Debugging across services = manual grep.

## Acceptance criteria
- [ ] `structlog` configured per service with JSON renderer
- [ ] Required fields per [[09 - Operations/Logging Standards]]
- [ ] `X-Request-ID` middleware: generate if absent, propagate to outbound calls
- [ ] `request_id` field in every log entry
- [ ] No PII in logs (lint rule)
- [ ] Remove all `print()` from `backend/`

## Files involved
- `shared/logging/setup.py` (new)
- Each service's `main.py` (mount logging middleware)
- Each service's `app/services/*.py` (replace `print`/`logging.info`)

## Tracked from
[[09 - Operations/Logging Standards]] · [[09 - Operations/Observability Stack#Trace IDs end-to-end]]
