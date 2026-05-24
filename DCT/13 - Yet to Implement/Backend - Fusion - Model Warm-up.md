---
tags: [yet-to-implement, p1, performance]
status: pending
priority: P1
estimate: 1 day
---

# Backend — Fusion — Model Warm-up

## Why
First call after restart takes ~6s for CodeBERT cold load. Should warm at startup.

## Acceptance criteria
- [ ] FastAPI `@app.on_event("startup")` triggers `analyze_code("warmup")`
- [ ] `/ready` returns 200 only after warmup completes
- [ ] Test: time from process start to `/ready=200` is < 15s

## Files involved
- `backend/fusion/app/main.py`

## Tracked from
[[12 - Expert Review/Reliability Loopholes#6]]
