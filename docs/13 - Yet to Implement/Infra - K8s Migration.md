---
tags: [yet-to-implement, p2]
status: pending
priority: P2
estimate: 3 weeks
---

# Infra — K8s Migration

## Why
docker-compose hits a ceiling around 1 host. Real production needs K8s.

## Acceptance criteria
- [ ] Helm chart per service
- [ ] One umbrella chart for the stack
- [ ] Ingress with TLS termination
- [ ] HPA per service per [[02 - System Architecture/Deployment Topology#Replication autoscaling]]
- [ ] Network policies (deny-all + per-pair allow)
- [ ] Pod security standards: restricted

## Files involved
- `infra/charts/`
- `infra/values/<env>.yaml`

## Tracked from
[[02 - System Architecture/Deployment Topology#Target Kubernetes]]
