# Tech Dashboard — Manage Devs & Create Manager

**Date:** 2026-06-04
**Status:** Approved (pending spec review)
**Area:** `/tech` dashboard (frontend) + auth microservice (backend)

## 1. Goal

Add two new tabs to the `/tech` Admin Console:

1. **Manage Devs** — list every developer with the name of the manager they're
   assigned to. Unassigned developers show a manager dropdown instead; selecting
   a manager assigns them. A top-right filter switches between **All /
   Assigned / Unassigned**.
2. **Create Manager** — a form to create a new manager account that lands in the
   canonical `managers` collection and can immediately be used for assignment.

All behaviour is backed by real API calls. New endpoints are added where missing,
and all three test layers (unit, functional/integration, API/Postman) are covered.

## 2. Current State (as explored)

- **Developers** live in the `users` collection with a `manager_id` string field
  pointing at a manager's `user_id` (e.g. `mgr_001`).
- **Managers** live in an isolated `managers` collection
  (`{user_id, username, name, email, department, phone_number, gender, role:"manager", ...}`).
- **Tech staff** live in `tech_staff`.
- Login/profile are polymorphic across the three collections.
- `GET /api/v1/auth/users/all` returns all developers (with `manager_id` but **not**
  the manager's name). Restricted to roles `manager`/`PM`/`tech`.
- `POST /api/v1/auth/users/assign-manager?developer_id=&manager_id=` sets
  `manager_id` on the dev and links the pair in THG (Neo4j). Works as-is.
- `POST /api/v1/auth/admin/create-manager` **is broken**: it inserts into the
  `users` collection instead of `managers`, and its DTO (`AdminCreateAccountDTO`)
  has a `role` regex of `^(senior_manager|hrm|tech_support)$` that doesn't even
  permit `"manager"`.
- There is **no endpoint to list managers** (needed for both the name column and
  the assign dropdown).
- Frontend `api` client (`frontend/src/lib/api/index.ts`) auto-attaches the
  `X-User-Role` header from the logged-in session — required by RBAC-guarded routes.
- The tech dashboard uses a top-nav tab pattern (`Infrastructure / Live Audit
  Logs / Data Vault`).

## 3. Design Decisions

- **Name resolution = frontend join (Approach A).** Add `GET /auth/users/managers`.
  The Manage Devs tab fetches devs (`/all`) + managers (`/managers`), builds a
  `manager_id → name` map client-side, and renders. Reasons: no backend N+1, `/all`
  stays untouched (it's reused by the PM dashboard), and the same managers list
  powers both the name column and the dropdown.
- **Fix `create-manager` to write to the `managers` collection** with
  `role: "manager"`. This is the canonical store login/profile read from.
- **New managers get a generated `user_id`** (UUID-based, e.g. `mgr_<hex>`).
  Seeded managers use `mgr_00x`, but all lookups are by `user_id`/`username`, so
  format is irrelevant for correctness.
- **Filtering is client-side** (All / Assigned / Unassigned). The full dev list is
  small (~50) and already fetched.
- **UI = two new tabs** (decided with user), matching the existing tab pattern and
  the dark/cyan tech-console theme.

## 4. Backend Changes (auth service)

### 4.1 New DTO — `shared/models/user.py`

```python
class ManagerCreateDTO(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    username: str = Field(..., min_length=3, max_length=50, pattern=r'^[a-zA-Z0-9_.]+$')
    email: str = Field(..., max_length=255)        # same email validator as registration
    phone_number: str = Field(..., min_length=10, max_length=15)
    gender: str = Field(..., pattern=r'^(Male|Female|Other)$')
    department: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=8, max_length=128)
```

(Email validated with the same regex `@field_validator` used by `UserRegistrationDTO`.)

### 4.2 New endpoint — `GET /api/v1/auth/users/managers` (`users.py`)

- Guard: `role_required(["tech", "manager", "PM"])`.
- Reads `managers` collection, projects out `password_hash`/`_id`.
- Returns `[{user_id, name, email, department}]` (department optional/may be absent).

### 4.3 Fix endpoint — `POST /api/v1/auth/admin/create-manager` (`admin.py`)

- Accept `ManagerCreateDTO` (replaces the misused `AdminCreateAccountDTO`).
- Duplicate check on `username`/`email` within the **`managers`** collection → 400.
- Generate `user_id = "mgr_" + uuid4().hex[:12]`.
- Insert into **`managers`** with `role: "manager"`, hashed password,
  `is_active: true`, `registered_at`, and all collected fields.
- Keep the best-effort THG `create-manager` sync (wrapped in try/except).
- Return `{status: "created", user_id, role: "manager"}` with 201.
- Router stays guarded by `role_required(["tech"])`.

### 4.4 Reused unchanged

- `POST /api/v1/auth/users/assign-manager?developer_id=&manager_id=` — no change.
- `GET /api/v1/auth/users/all` — no change.

## 5. Frontend Changes

### 5.1 API client — `frontend/src/lib/api/index.ts`

Extend `authApi`:
- `getManagers: () => api.get('/auth/users/managers')`
- `createManager: (data) => api.post('/auth/admin/create-manager', data)`
- `assignManager: (developerId, managerId) => api.post('/auth/users/assign-manager', null, { params: { developer_id: developerId, manager_id: managerId } })`

### 5.2 New component — `frontend/src/components/tech/ManageDevs.tsx`

- On mount, fetch `getAllUsers()` + `getManagers()` in parallel.
- Build `managerMap = { user_id: name }`.
- Render a table: **Name** | **Manager**.
  - Assigned dev (`manager_id` truthy & present in map): show manager name.
  - Unassigned dev: render a `<select>` of managers (option label = `name —
    department`, value = `user_id`) with a placeholder. On change, call
    `assignManager(dev.user_id, managerId)`, then optimistically update local
    state / refetch.
- Top-right filter control: **All / Assigned / Unassigned** (client-side filter on
  `manager_id`). Default **All**.
- Loading + empty + error states; theme-consistent styling.

### 5.3 New component — `frontend/src/components/tech/CreateManager.tsx`

- Controlled form: name, username, email, phone_number, gender (select),
  department, password.
- Submit → `createManager(payload)`. On 201: success toast/banner + reset form.
  On 400 (duplicate) / 422 (validation): inline error message from response.
- Theme-consistent styling.

### 5.4 Dashboard wiring — `frontend/src/app/tech/dashboard/page.tsx`

- Extend `activeTab` union with `'devs' | 'managers'`.
- Add two nav buttons (`Manage Devs` with `Users` icon, `Create Manager` with
  `UserPlus` icon — both already imported).
- Render `<ManageDevs />` and `<CreateManager />` for the new tabs.

## 6. Testing

### 6.1 Unit tests (pytest `-m unit`) — `backend/auth/test/unit/test_models.py`

Add `TestManagerCreateDTO`:
- Valid payload passes; email is lower-cased.
- Missing required field (e.g. `department`, `email`) → `ValidationError`.
- Invalid gender / too-short password → `ValidationError`.

### 6.2 Functional / integration tests (pytest `-m integration`) — `backend/auth/test/integration/test_routes.py`

Following the existing `_make_mock_col` / ASGI `client` pattern (single mocked
collection via `get_collection`). All RBAC-guarded calls send header
`X-User-Role: tech`.

- `TestManagersDirectory`
  - `GET /api/v1/auth/users/managers` with tech role → 200, returns a list.
  - Without/with wrong role header → 403.
- `TestCreateManager`
  - `POST /api/v1/auth/admin/create-manager` valid payload → 201, body has
    `user_id` and `role == "manager"`. (Mock `find_one` returns `None` = no dup.)
  - Missing field / bad gender → 422.
  - Duplicate (mock `find_one` returns a doc) → 400.
- `TestAssignManager` (smoke)
  - `POST /api/v1/auth/users/assign-manager?developer_id=d1&manager_id=mgr_x`
    → 200 `{status: "success"}` (THG call mocked/tolerated).

### 6.3 API endpoint tests (Postman / Newman) — `postman/ADT-Complete-Test-Suite.postman_collection.json`

Add to the **Auth Service** folder (each request sends `X-User-Role: tech`):
- **List Managers** — `GET {{AUTH_URL}}/api/v1/auth/users/managers` → expect 200,
  body is an array. Capture first `user_id` into env var `manager_id` for reuse.
- **Create Manager** — `POST {{AUTH_URL}}/api/v1/auth/admin/create-manager` with a
  unique `username`/`email` (`{{$timestamp}}`) → expect 201, `role == "manager"`.
- **Create Manager — Missing Field (Negative)** → expect 422.
- **Assign Manager** — `POST .../users/assign-manager?developer_id={{user_id}}&manager_id={{manager_id}}`
  → expect 200 or 404 (dev may not exist in a fresh env).

Runs under both existing environments (Direct-Services and Gateway).

## 7. Documentation Updates

- `README.md` — extend the **Tech Admin (`/tech`)** bullet list with "Manage Devs
  (assign managers to developers)" and "Create Manager accounts". Bump endpoint
  count if it's referenced.
- `docs/03 - Microservices/` (auth service page) — document the new
  `GET /auth/users/managers` and corrected `POST /auth/admin/create-manager`, plus
  their Testing section entries.
- `docs/05 - Frontends/` — document the two new tech-dashboard tabs.

## 8. Out of Scope (YAGNI)

- Editing/deleting managers (Data Vault explorer already allows edits).
- Re-assigning an already-assigned developer (only unassigned devs get the
  dropdown). Re-assignment can be done via the Data Vault explorer if needed.
- Pagination/search on the dev table (list is small).
- Bulk assignment.

## 9. Acceptance Criteria

1. `/tech` dashboard shows two new tabs: **Manage Devs** and **Create Manager**.
2. Manage Devs lists all developers with their manager's name; unassigned devs show
   a working manager dropdown that assigns on selection and persists to the DB.
3. The All/Assigned/Unassigned filter works.
4. Create Manager creates a manager in the `managers` collection that can log in and
   be selected in the assign dropdown.
5. All new unit, integration, and Postman tests pass; existing tests stay green.
6. README + docs updated.
