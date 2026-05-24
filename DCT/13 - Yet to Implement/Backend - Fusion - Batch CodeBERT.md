---
tags: [yet-to-implement, p1, performance]
status: pending
priority: P1
estimate: 3 days
---

# Backend — Fusion — Batch CodeBERT

## Why
Every snippet is a separate forward pass. Batch mode (32×) drops per-snippet latency 2-3×.

## Acceptance criteria
- [ ] `CodeBERTAnalyzer.batch_analyze(snippets)` uses true batch tokenization + forward pass
- [ ] `/run` collects snippets across the user-batch and calls batch_analyze once
- [ ] Tests: batch of 32 snippets faster than 32 single calls

## Files involved
- `backend/fusion/app/services/ai_core.py`
- `backend/fusion/app/routers/fusion.py`

## Tracked from
[[12 - Expert Review/Scalability Loopholes#CodeBERT inference]]
