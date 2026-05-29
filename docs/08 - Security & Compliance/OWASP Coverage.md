---
tags: [security, compliance]
---

# OWASP Top 10 Coverage

Mapping our posture against [OWASP API Security Top 10 (2023)](https://owasp.org/API-Security/editions/2023/en/0x11-t10/).

| # | Risk | Today | Target | Tracked |
|:-:|:-----|:------|:-------|:--------|
| API1 | **Broken Object Level Auth** | Vulnerable — endpoints like `/skills/{dev_id}` don't check requester is permitted | Add `is_self_or_squad_member` checks | [[13 - Yet to Implement/Backend - All - BOLA Checks]] |
| API2 | **Broken Authentication** | Vulnerable — see [[Auth & Sessions#Today]] | JWT + refresh, MFA for admins | [[13 - Yet to Implement/Backend - Auth - JWT + Sessions]] |
| API3 | **Broken Object Property Level Auth** | Vulnerable — Mongo Data Explorer returns full docs incl. password_hash | Field-level allowlists; never return password_hash | [[13 - Yet to Implement/Backend - Auth - Data Explorer Hardening]] |
| API4 | **Unrestricted Resource Consumption** | Vulnerable — no rate limit, snapshot size cap, request body cap | Rate limit + body cap + concurrency limit | [[13 - Yet to Implement/Backend - Gateway - Rate Limiting]] / [[13 - Yet to Implement/Backend - Gateway - Body Size Limits]] |
| API5 | **Broken Function Level Auth** | Vulnerable — RBAC header trust | Signed headers from gateway only | [[13 - Yet to Implement/Backend - All - RBAC Signed]] |
| API6 | **Unrestricted Business Flow** | Partial — no flow rate limit (e.g. "register 1000 accounts/min") | Behavioral rate limit | [[13 - Yet to Implement/Backend - Auth - Behavioral Limits]] |
| API7 | **Server-Side Request Forgery** | **Vulnerable** — `analyze-project` takes a GitHub URL from registration and clones it; could be made to hit internal services | URL allowlist (github.com only) + egress restrictions | [[13 - Yet to Implement/Backend - Fusion - SSRF Guard]] |
| API8 | **Security Misconfiguration** | `allow_origins=["*"]` in services; default secrets; CORS open | Tight config; secrets via Vault | [[Secrets Management]] |
| API9 | **Improper Inventory Management** | No API catalog; some endpoints in Postman only | Auto-generated OpenAPI per service; CI checks for orphans | [[13 - Yet to Implement/Backend - All - OpenAPI Catalog]] |
| API10 | **Unsafe Consumption of APIs** | We call GitHub, CodeBERT model HF hub — no SSRF/cert checks | Pin GitHub TLS cert; sandbox HF download | [[13 - Yet to Implement/Backend - Fusion - GitHub Hardening]] |

## OWASP Top 10 (Web — 2021) — short

| # | Risk | Comment |
|:-:|:-----|:--------|
| A01 | Broken Access Control | Same as API1+5 |
| A02 | Cryptographic Failures | Bcrypt OK but cost unverified; in-transit not yet enforced TLS |
| A03 | Injection | Parameterized Cypher + Mongo queries → good. Watch the Data Explorer. |
| A04 | Insecure Design | RBAC-header design is **insecure by design**. Fix in [[13 - Yet to Implement/Backend - All - RBAC Signed]] |
| A05 | Security Misconfiguration | Same as API8 |
| A06 | Vulnerable Components | No dep-vulnerability scanning yet. Add Dependabot/Snyk. |
| A07 | Identification & Auth Failures | See [[Auth & Sessions]] |
| A08 | Software & Data Integrity Failures | No SBOM, no signed releases. Add in [[13 - Yet to Implement/Infra - SBOM + Sigstore]] |
| A09 | Security Logging Failures | Audit log exists but isn't tamper-proof. See [[Audit Logging]] |
| A10 | SSRF | Same as API7 |
