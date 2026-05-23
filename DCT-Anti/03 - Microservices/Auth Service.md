---
tags: [service, security]
aliases: [Auth]
---

# Auth Service

## Identity

| | |
|:---|:---|
| Port | `8001` → `8000` |
| Hostname | `auth-service` |
| Code | `backend/auth/` |
| Entry | `backend/auth/app/main.py` |
| Health | `GET /api/v1/auth/health` |

## Responsibilities

- **3-collection polymorphic identity** — users, managers, tech_staff
- **Registration** (developers) + admin-driven account creation (managers, HRM, tech)
- **[[07 - Algorithms/SHA-HWID Anchor|Hardware Lock]]** — bind extension_id ↔ machine_id
- **Extension validation** — gatekeeper for [[Telemetry Service|telemetry]] ingest
- **Squad lookup** — `GET /squad/{manager_id}` for [[Task Service|task]] scoping
- **Universal Mongo Data Explorer** (tech-admin only) — see Admin router

## Routes

### Users router — `prefix /api/v1/auth/users`

| Method | Path | Handler | Purpose |
|:-------|:-----|:--------|:--------|
| POST | `/login` | `login_user(LoginDTO)` | Polymorphic auth across 3 collections |
| POST | `/register` | `register_user(UserRegistrationDTO, bg_tasks)` | Create dev + gen ext_id + whitelist + bg analyze-project |
| POST | `/save-session` | `save_reg_session(session_id, data)` | Stash partial registration in Redis 24h |
| GET | `/get-session/{session_id}` | `get_reg_session(session_id)` | Retrieve from Redis |
| GET | `/validate?field=&value=` | `validate_field(field, value)` | Uniqueness pre-check |
| GET | `/all` (role-gated) | `get_all_users()` | Directory |
| GET | `/squad/{manager_id}` (role-gated) | `get_manager_squad(manager_id)` | Squad members |
| GET | `/profile/{user_id}` | `get_user_profile(user_id)` | Polymorphic lookup |
| POST | `/hardware-lock` | `hardware_lock(ext_id, machine_id)` | First-time bind or verify |
| POST | `/validate-extension` | `validate_extension({ext_id, machine_id})` | SHA-HWID handshake |
| POST | `/assign-manager` | `assign_manager(dev_id, manager_id)` | MANAGES edge in THG |

### Admin router — `prefix /api/v1/auth/admin` (role=tech)

| Method | Path | Handler | Purpose |
|:-------|:-----|:--------|:--------|
| POST | `/create-manager` | `create_manager(AdminCreateAccountDTO)` | Tech creates manager + THG node |
| POST | `/create-account` | `create_admin_account(AdminCreateAccountDTO)` | Tech creates HRM/Senior Dev |
| GET | `/explorer/collections` | `list_collections()` | Mongo collection names |
| GET | `/explorer/{collection}?limit&skip&filter_key&filter_val` | `get_collection_data(...)` | Browse any collection |
| PATCH | `/explorer/{collection}/{doc_id}` | `update_document_field(...)` | Universal updater (tries `_id`, `user_id`, `key`, `task_id`) |
| POST | `/explorer/{collection}/{doc_id}/field` | `add_document_field(...)` | Schema expansion live |
| GET | `/config` | `get_system_config()` | Global config with defaults |

### Stubs

- `connect.py` — empty (planned: OAuth + SSO)
- `notifications.py` — empty (planned: per-user inbox)

## Models / DTOs

In `shared/models/user.py`:

- [[06 - Data Models/DTO - User Registration|UserRegistrationDTO]]
- `LoginDTO {username, password}`
- `UserDocument {user_id, extension_id, name, username, email, role, experience_level, strong_domains, registered_at, machine_id?, last_known_state_hash?, last_sync_at?}`
- `UserProfileResponse` — password-free response
- `AdminCreateAccountDTO {name, username, email, phone_number, gender, password, role}` where `role ∈ {senior_manager, hrm, tech_support}`

## Services / Business logic

- **passlib.CryptContext** — bcrypt hashing (72-byte cap). Default cost — should be raised to 12 ([[13 - Yet to Implement/Backend - Auth - Bcrypt Cost]]).
- **Polymorphic lookup** — `get_user_profile` queries `users → managers → tech_staff` in order; first match wins.
- **Extension generation** — `extension_id = uuid4().hex` (no relation to user_id, intentional).
- **Hardware lock state machine**:
  - First call with `machine_id` → write to `whitelist.machine_id`
  - Subsequent calls must match — if not, `403 Hardware Mismatch`.
  - Tech admin can reset via Data Explorer.

## Database

### Mongo collections (owner: Auth)

| Collection | Indexes |
|:-----------|:--------|
| `users` | `user_id` unique, `username` unique, `email` unique, `extension_id` unique |
| `managers` | `user_id` unique, `username` unique, `email` unique |
| `tech_staff` | `user_id` unique, `username` unique, `email` unique |
| `whitelist` | `extension_id` unique, `(extension_id, machine_id)` |

### Redis

| Key | TTL | Purpose |
|:----|:---:|:--------|
| `reg_session:{session_id}` | 24 h | Partial registration draft |

## Env vars

| Name | Default | Purpose |
|:-----|:--------|:--------|
| `FUSION_URL` | `http://127.0.0.1:8005` | for bg project analysis |
| `THG_URL` | `http://127.0.0.1:8008` | for create-dev + link |
| `REDIS_URL` | `redis://localhost:6379` | sessions |
| `MONGO_URI` | (shared) | persistence |
| `MONGO_DB_NAME` | `adt_db` | persistence |

## Outbound calls

| To | Endpoint | When |
|:---|:---------|:-----|
| THG | `POST /create-dev` | on register |
| THG | `POST /create-manager` | on admin create_manager |
| THG | `POST /link-manager-dev` | on assign_manager |
| Fusion | `POST /analyze-project` | per github_url in registration (background) |

## Background tasks

- Per-`github_url` `analyze-project` posts via FastAPI `BackgroundTasks`. Risks:
  - Failure is silent → see [[12 - Expert Review/Observability Gaps]]
  - No retry → see [[13 - Yet to Implement/Backend - Auth - Project Analysis Status]]

## Known gaps

- **No refresh tokens** — login returns user data; no token issuance. Frontend stores user info in localStorage. P0 for prod.
- **`allow_origins=["*"]`** — too permissive. Use gateway allowlist.
- **RBAC is header-based** — `X-User-Role` is trusted by the service. Must be **signed** or set by gateway after JWT verification. P0.
- **Data Explorer is a backdoor** — full read/write on any collection. Must be feature-flagged and audit-logged. P0.

Tracked:
- [[13 - Yet to Implement/Backend - Auth - JWT + Sessions]]
- [[13 - Yet to Implement/Backend - Auth - Refresh Tokens]]
- [[13 - Yet to Implement/Backend - Auth - Data Explorer Hardening]]
- [[13 - Yet to Implement/Backend - All - RBAC Signed]]
