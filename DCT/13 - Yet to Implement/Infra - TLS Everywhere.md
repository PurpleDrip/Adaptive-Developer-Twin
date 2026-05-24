---
tags: [yet-to-implement, p1, security]
status: pending
priority: P1
estimate: 3 days
---

# Infra — TLS Everywhere

## Why
Today HTTP. Production must enforce TLS 1.3 end-to-end at ingress.

## Acceptance criteria
- [ ] TLS 1.3 at ingress (NGINX/Envoy)
- [ ] HSTS header
- [ ] HTTP → HTTPS redirect
- [ ] Cert auto-renewal via cert-manager (Let's Encrypt) or ACM
- [ ] mTLS between gateway and services (optional but preferred)

## Files involved
- Ingress config

## Tracked from
[[08 - Security & Compliance/Encryption at Rest & Transit#In transit]]
