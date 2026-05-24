---
tags: [security, risk-security]
---

# Security Loopholes

> Found by reading the code, not by attacking it. An actual pentest would find more.

## 1. `X-User-Role` is client-controlled

The `shared/auth/rbac.role_required` dependency trusts whatever role the request claims via the `X-User-Role` header.

```python
async def role_required(allowed_roles: List[str], request: Request):
    role = request.headers.get("X-User-Role")
    if role not in allowed_roles:
        raise HTTPException(403)
```

A regular user can `curl -H "X-User-Role: tech" .../admin/explorer/users` and read every password hash.

**Fix**: Gateway verifies JWT, **sets** `X-User-Role` from the verified token, **and** signs it (HMAC or mTLS gate per service so only gateway can write that header).

## 2. CORS `allow_origins=["*"]` on every microservice

Each service does `allow_origins=["*"]`. Combined with `allow_credentials=True`, this is **forbidden by the CORS spec** but FastAPI lets you set it; the browser will reject credentialed requests with `*`, but plain (cookieless) requests with credentials in headers (Authorization) will still work cross-origin.

**Fix**: Set per-env allowlist in env var. Strict in prod.

## 3. `POST /api/v1/thg/generate-demo-data` is unauthenticated

```python
@router.post("/generate-demo-data")
async def generate_demo_graph(session: ...):
    # MATCH (n) DETACH DELETE n
    ...
```

Any unauthenticated POST destroys the prod graph.

**Fix**: Gate by `role=tech_admin` AND env != prod (or explicit override).

## 4. Data Explorer returns `password_hash`

`GET /api/v1/auth/admin/explorer/users` returns full docs without field filtering. The Tech Admin sees bcrypt hashes. While bcrypt-protected, this is unnecessary exposure.

**Fix**: Field allowlist; never project `password_hash` to the response.

## 5. Snapshot URL is unauthenticated

`workspace_snapshot_url` is accepted as user input and the server downloads it (in `deep_audit`). Today this could point to:

- An internal AWS metadata endpoint (`http://169.254.169.254/latest/meta-data/...`)
- Internal services (`http://thg-service:8000/api/v1/thg/skills/victim_id`)
- A malicious large file (DoS via memory)

**SSRF + arbitrary download.**

**Fix**: Whitelist scheme + domain + size. Snapshots come from **our** object storage only — server issues an opaque snapshot_id; the URL is server-internal.

## 6. `extension_id` enumeration

`GET /api/v1/auth/users/validate?field=extension_id&value=X` returns `{available: false}` for known IDs. An attacker can enumerate.

**Fix**: Either remove the lookup for `extension_id` (only allow username/email validation) or rate-limit + add captcha.

## 7. Bcrypt cost unverified

`passlib.CryptContext(schemes=["bcrypt"])` uses passlib defaults. Need to verify cost ≥ 12. At cost 4 (default unless overridden), brute force is trivial.

**Fix**: `CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)`.

## 8. No CSRF protection

State-mutating endpoints accept POST without CSRF tokens. With cookie-based auth (planned), this is exploitable.

**Fix**: SameSite=Strict cookies + CSRF token for state-changing requests OR adopt the JWT-in-Authorization-header pattern (no cookies → no CSRF).

## 9. Audit log mutable

Mongo role used by services has full CRUD. A compromised service can delete its own audit entries.

**Fix**: Insert-only role for the audit_logs collection. Hash chain for tamper detection.

## 10. Background tasks fail silently

`BackgroundTasks` in `register_user` for `analyze-project`: exceptions are swallowed. A malicious GitHub URL crashes the task with no log, no audit, no retry — so the dev's twin never gets the baseline THEY expected.

**Fix**: Wrap in try/except with structured log + audit + status field on user doc.

## 11. Race in hardware lock

```python
doc = await whitelist.find_one({"extension_id": ext_id})
if doc.machine_id is None:
    await whitelist.update_one({...}, {"$set": {"machine_id": mid}})
```

Between `find_one` and `update_one`, another request could lock. The second-write wins.

**Fix**: Atomic update with condition: `update_one({"extension_id": ext_id, "machine_id": None}, {"$set": {"machine_id": mid}})`. Returns modified count = 0 → already locked.

## 12. `LoginDTO.password` echoed back?

Need to verify Auth's login response doesn't leak the password from the request body in error responses (FastAPI validation errors include input). Run a fuzz to confirm.

**Fix**: Custom validation error handler that strips password from echoed input.

---

All tracked in [[13 - Yet to Implement/_MOC]]. Priorities in [[Top Risks (Ranked)]].
