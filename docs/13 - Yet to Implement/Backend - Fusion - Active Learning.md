---
tags: [yet-to-implement, p2]
status: pending
priority: P2
estimate: 1 week
---

# Backend — Fusion — Active Learning

## Why
Domain centroids are seeded from a small handcrafted set. Over time we want to refine via real positively-labeled examples.

## Acceptance criteria
- [ ] Periodic job samples 100 highest-confidence snippets per domain
- [ ] Manager / data-team reviews; approves additions to centroid corpus
- [ ] Re-compute centroids weekly
- [ ] Audit which centroids are in use per `engine_version`

## Files involved
- `backend/fusion/app/services/online_learner.py`
- `scripts/active_learning.py` (new)

## Tracked from
[[07 - Algorithms/CodeBERT Pipeline#Known gaps]]
