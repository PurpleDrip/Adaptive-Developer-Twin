---
tags: [yet-to-implement, p2]
status: pending
priority: P2
estimate: 3 days
---

# Backend — Telemetry — Aggregation Fairness Review

## Why
Each aggregation choice (exclude idle from WPM, count commits, cap top_files at 20) is a fairness choice. Quarterly review keeps assumptions honest.

## Acceptance criteria
- [ ] Documented audit cycle (quarterly) in [[09 - Operations/_MOC]]
- [ ] Checklist of aggregations to question
- [ ] Output: a written review per quarter

## Files involved
- documentation only

## Tracked from
[[07 - Algorithms/SWEF-Ingestion (Sliding Window)#The fairness lens]]
