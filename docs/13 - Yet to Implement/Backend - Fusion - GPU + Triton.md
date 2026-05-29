---
tags: [yet-to-implement, p2, performance]
status: pending
priority: P2
estimate: 1 week
---

# Backend — Fusion — GPU + Triton

## Why
For 100k+ devs, CPU inference is the bottleneck. GPU via Triton Inference Server gets us 10× headroom.

## Acceptance criteria
- [ ] Triton container hosts `microsoft/codebert-base` ONNX export
- [ ] Fusion service calls Triton via gRPC (with retry + circuit breaker)
- [ ] Fallback to local CPU inference if Triton down
- [ ] Tests: end-to-end with Triton in compose

## Files involved
- IaC: Triton deployment
- `backend/fusion/app/services/ai_core.py` (Triton client)

## Tracked from
[[12 - Expert Review/Scalability Loopholes]]
