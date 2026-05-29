---
tags: [moc, yet-to-implement, p0]
---

# P0 — Critical Blockers

> Cannot ship to any production customer until these are done. Ranked by impact-per-effort.

## Open

1. [[Backend - All - RBAC Signed]] — gateway-signed `X-User-Role`; reject client-supplied.
2. [[Backend - Auth - JWT + Sessions]] — replace localStorage session with JWT + refresh.
3. [[Backend - Auth - Refresh Tokens]] — opaque refresh in httpOnly cookie + rotation w/ family.
4. [[Extension - Secret Filter]] — client-side allowlist + secret scanner before snippet/snapshot send.
5. [[Backend - Telemetry - Snapshot Storage]] — signed URLs to object storage; no base64 in body.
6. [[Backend - Telemetry - Snippet Envelope Encryption]] — KMS envelope for `code_snippet`.
7. [[Backend - Telemetry - Server-Side Secret Scan]] — defense-in-depth scan at ingest.
8. [[Backend - All - Service-to-Service Auth]] — internal service tokens or mTLS.
9. [[Backend - Gateway - Rate Limiting]] — token-bucket per endpoint at gateway.
10. [[Backend - Fusion - SSRF Guard]] — URL allowlist for snapshot + project URLs.
11. [[Backend - Auth - Data Explorer Hardening]] — field allowlist; audit every write; no password_hash in response.
12. [[Backend - THG - Demo Endpoint Gate]] — gate `/generate-demo-data` behind RBAC + env.
13. [[Backend - Fusion - Real ML Pipeline]] — implement the 6 stubbed services or remove from path.
14. [[Compliance - GDPR Right to Erase]] — Mongo + Neo4j + Redis + snapshots flow.
15. [[Compliance - GDPR Data Export]] — Article 15 endpoint with full bundle.

## Done

(none yet)
