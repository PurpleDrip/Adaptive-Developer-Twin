---
tags: [yet-to-implement, p2, observability]
status: pending
priority: P2
estimate: 1 day
---

# Backend — All — OpenAPI Catalog

## Why
Each FastAPI service exposes OpenAPI but they're not aggregated. No central catalog.

## Acceptance criteria
- [ ] Build job collects each service's `/openapi.json`
- [ ] Aggregates into `docs/openapi.bundle.json` with prefixed paths
- [ ] Hosts at `https://docs.adt.example.com` (Stoplight/Redoc)
- [ ] CI fails if a Postman collection references an endpoint that's not in the catalog

## Files involved
- `scripts/build_openapi.py` (new)

## Tracked from
[[08 - Security & Compliance/OWASP Coverage#API9]]
