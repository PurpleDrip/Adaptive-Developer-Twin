---
tags: [yet-to-implement, p0, security]
status: pending
priority: P0
estimate: 2 days
---

# Backend — Gateway — Rate Limiting

## Why
No rate limit anywhere. `/login` and `/ingest` are both floodable.

## Acceptance criteria
- [ ] Per-endpoint token bucket at gateway (or NGINX layer if deployed behind ingress)
- [ ] Limits per [[08 - Security & Compliance/Rate Limiting & Abuse#Target Tier-1]]
- [ ] Sensitive endpoints reject 429 with `Retry-After`
- [ ] Ingest endpoint "shapes" instead of rejects (accept 4/min, silently drop excess from same ext_id)
- [ ] Metrics: `rate_limited_total{endpoint, reason}`
- [ ] Tests: 100 rapid `/login` calls from one IP get 429 after 5

## Files involved
- `backend/gateway/app/middleware/ratelimit.py` (new)
- OR NGINX config if using ingress

## Tracked from
[[08 - Security & Compliance/Rate Limiting & Abuse]]
