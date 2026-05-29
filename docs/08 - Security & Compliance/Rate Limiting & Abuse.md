---
tags: [security, reliability]
---

# Rate Limiting & Abuse

## Today

- **No rate limiting anywhere.** Any caller can flood any endpoint.

## Target (Tier-1)

| Endpoint | Limit | Window | Strategy |
|:---------|:-----:|:------:|:---------|
| `POST /api/v1/auth/users/login` | 5 | 1 min / IP | Reject 429 |
| `POST /api/v1/auth/users/register` | 5 | 1 hour / IP | Reject 429 |
| `POST /api/v1/auth/users/hardware-lock` | 3 | 1 hour / extension_id | Reject 429 |
| `POST /api/v1/telemetry/ingest` | 4 | 1 min / extension_id | **Shape**, don't reject — accept but drop the excess |
| `POST /api/v1/telemetry/handshake` | 4 | 1 min / extension_id | Same |
| `GET /api/v1/thg/skills/*` | 60 | 1 min / user | Reject 429 |
| `GET /api/v1/monitoring/audit-log` | 30 | 1 min / user | Reject 429 |

## Where to enforce

**Primary**: at the gateway (NGINX / Envoy / Cloudflare). Reject before the request hits a microservice.

**Secondary**: per-service for sensitive endpoints (defense in depth).

## Implementation (gateway-level)

Using a token-bucket algorithm:

```yaml
# nginx
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

location /api/v1/auth/users/login {
    limit_req zone=login burst=2 nodelay;
    proxy_pass http://auth-service:8000;
}
```

Cloudflare-equivalent: a rule per endpoint + WAF.

## Why "shape, don't reject" for ingest

A legit extension may briefly burst (e.g., recovering from a network drop). Rejecting means losing data. **Shape** means letting through 4/min and silently dropping the rest server-side — the data was duplicated anyway (or the next window will catch up).

Tracking the rejected counter is critical: if a real dev sees >1% rejection rate, the limit is wrong.

## Abuse beyond rate limits

| Pattern | Detection | Response |
|:--------|:----------|:---------|
| Same extension_id, many machine_ids in N minutes | Auth `/validate-extension` returning 403 many times | Block extension_id; alert tech admin |
| Massive `/register` from one IP | Rate limit + bot signature | Block IP + WAF rule |
| Account enumeration via `/validate?field=username&value=*` | Pattern detection | Rate-limit per IP, add captcha after threshold |
| Token reuse (refresh token used twice) | Auth `family_id` mismatch | Revoke whole token family |

## DDoS posture

- **Cloudflare/AWS Shield Standard** at the edge — free baseline
- **Anycast** routing
- **Connection limits** per-source-IP
- Egress: rate-limit outbound to internal services to prevent cascading failures

## Cost shaping

A legitimate enterprise with 10 k devs generates ~333 ingest/s. Burst to 2x is normal. Set capacity headroom at 5x to absorb spike events (e.g., everyone starts coding at 9:01 AM on Monday).

Tracked: [[13 - Yet to Implement/Backend - Gateway - Rate Limiting]].
