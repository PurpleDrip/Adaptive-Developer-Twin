---
tags: [yet-to-implement, p1]
status: pending
priority: P1
estimate: 1 week
---

# Infra — Load Test Harness

## Why
We can't claim "10k devs" without testing 10k devs.

## Acceptance criteria
- [ ] `k6` (or Locust) scripts replaying realistic mix: 70% `/ingest`, 20% dashboard reads, 10% PM flows
- [ ] Runs weekly in CI against staging
- [ ] Pass criteria: meet [[09 - Operations/SLOs & SLIs]] for 1 hour at 10k concurrent
- [ ] Publishes a graph artifact

## Files involved
- `loadtests/` (new)

## Tracked from
[[12 - Expert Review/Scalability Loopholes#Load test plan]]
