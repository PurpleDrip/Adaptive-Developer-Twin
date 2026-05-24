---
tags: [yet-to-implement, p0, security]
status: pending
priority: P0
estimate: 3 days
---

# Backend — All — Service-to-Service Auth

## Why
Internal services accept any request. A compromised pod can call any other service freely.

## Acceptance criteria
- [ ] Two options — pick one:
  - **Option A**: HMAC service tokens. Shared symmetric key per environment. Each cross-service call includes `X-Service-Token: <hmac>`. Token covers `(caller, callee, timestamp, body_hash)`. Replay window 30 s.
  - **Option B**: mTLS via service mesh (Linkerd / Istio). No app code changes.
- [ ] Microservice rejects calls without a valid service token (or mTLS identity)
- [ ] Gateway is identified as `gateway` (the only one allowed to set client headers like `X-User-Role`)
- [ ] Tests: simulate compromised pod scenario — cross-service call without token fails

## Files involved
- `shared/auth/service_token.py` (new — issuer + verifier)
- Every service's `main.py` (add middleware)

## Tracked from
[[08 - Security & Compliance/Threat Model#Trust boundaries]] · [[12 - Expert Review/Top Risks (Ranked)#4]]
