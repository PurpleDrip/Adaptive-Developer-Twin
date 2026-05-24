---
tags: [security]
---

# Auth & Sessions

## Today (V1)

- `POST /api/v1/auth/users/login` returns the **user document** (minus password_hash)
- Frontend stores it in `localStorage`
- Frontend sends `X-User-Role` header on every request
- `shared/auth/rbac.role_required` reads that header

**Risks**:

- Trivially spoofable — edit localStorage
- No expiry
- No way to revoke
- Header isn't signed — any caller can claim any role

## Target (Tier-1)

- Login returns `{ access_token, refresh_token, user }`
- Access token (JWT) — 15 min TTL, signed with rotating key
- Refresh token — 7 days, opaque, stored in httpOnly secure cookie
- Refresh endpoint rotates both tokens
- Logout endpoint invalidates the refresh token
- Gateway verifies access token on every request; injects `X-User-Id` and `X-User-Role` **after** verification
- Microservices accept these headers **only** from the gateway (mTLS or signed)

```mermaid
sequenceDiagram
    Client->>Gateway: POST /login {u, p}
    Gateway->>Auth: forward
    Auth->>Auth: verify bcrypt
    Auth-->>Gateway: { access_jwt, refresh_jwt, user }
    Gateway-->>Client: Set-Cookie refresh; body access
    note over Client: store access in memory only
    Client->>Gateway: GET /thg/skills/me  (Authorization: Bearer access)
    Gateway->>Gateway: verify JWT signature + expiry
    Gateway->>THG: forward + X-User-Id (signed by gateway)
    THG-->>Client: skills
    note over Client: 14 min later
    Client->>Gateway: POST /refresh
    Gateway->>Auth: verify refresh cookie
    Auth-->>Gateway: new pair
    Gateway-->>Client: rotated cookie + body
```

## JWT shape

```json
{
  "sub": "user_id",
  "role": "developer",
  "exp": 1755012345,
  "iss": "adt-auth",
  "jti": "uuid",
  "v": 1
}
```

Signed with **RSA-256** (asymmetric — public key in every microservice's startup) or **ES256**.

## Refresh token

Opaque random 256-bit, stored in Redis: `refresh:{token} → { user_id, issued_at, family_id }`.

On rotation, **the old token is invalidated** and the new one inherits the `family_id`. If a previously-rotated token is ever used again → **the whole family is revoked** (token reuse detection).

## Password policy

- bcrypt cost **≥ 12**
- min length 12 (UI), 8 (server — for migration)
- reject 1000 most common passwords
- rate-limit `/login` to 5/min/IP

## MFA (future)

- TOTP for managers and tech_staff
- Backup codes
- Optional for developers

Tracked: [[13 - Yet to Implement/Backend - Auth - JWT + Sessions]], [[13 - Yet to Implement/Backend - Auth - Refresh Tokens]], [[13 - Yet to Implement/Backend - Auth - MFA]].
