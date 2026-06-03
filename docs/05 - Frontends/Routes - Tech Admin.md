---
tags: [frontend, ux, observability]
---

# Routes — Tech Admin

## `/tech` (login + role landing)

Login form for `tech_staff` collection.

## `/tech/dashboard`

The **Infrastructure Mastery** view. Three panels:

### Panel 1 — System Health rollup

Calls `GET /api/v1/monitoring/system-health` every 10 s.

```
┌────────────────────────────────────────┐
│  System Health                         │
│                                        │
│  ● Gateway   ok     ● Auth    ok       │
│  ● Telemetry ok     ● Fusion  degraded │
│  ● THG       ok     ● Alloc   ok       │
│  ● Analytics ok     ● Mon     ok       │
│  ● Task      ok                        │
│                                        │
│  Overall: degraded  (Fusion p99 1.4s)  │
└────────────────────────────────────────┘
```

### Panel 2 — Live Audit HUD (`components/tech/LiveAuditHUD.tsx`)

Realtime stream from the WebSocket `audit:stream`.

```
┌────────────────────────────────────────────────────────────┐
│  Live Audit · ▶ paused                                     │
│                                                            │
│  12:04:17  skill_update    dev_alice   backend 0.72→0.74   │
│  12:04:16  task_assigned   pm_carol   task-1023 → dev_bob  │
│  12:04:15  fraud_flag      dev_eve    batch-...  rel 0.31  │
│  12:04:14  config_change   tech_admin heartbeat 30→60      │
│  ...                                                       │
│                                                            │
│  [▶ Resume]  [↓ Download CSV]  [Filter ▾]                  │
└────────────────────────────────────────────────────────────┘
```

See [[02 - System Architecture/Sequence - Live Audit HUD]] for the protocol.

### Panel 3 — System Config

Bound to `/system-config`. Tech can:

- Adjust `heartbeat_interval_seconds` (with confirmation dialog explaining impact)
- Adjust `batch_interval_minutes`
- Toggle the working-hours window (planned)
- See history of who-changed-what (planned — depends on [[13 - Yet to Implement/Backend - Monitoring - Audit System Config]])

### Panel 4 — Batch Processing Status

`GET /api/v1/monitoring/batch-status` — last 10 batches with status + record counts.

### Tab — Manage Devs (`components/tech/ManageDevs.tsx`)

Lists every developer (`GET /api/v1/auth/users/all`) alongside the name of their
assigned manager, resolved client-side against the managers directory
(`GET /api/v1/auth/users/managers`).

- Assigned devs show the manager's name (green check).
- **Unassigned devs show a manager dropdown** instead; selecting a manager calls
  `POST /api/v1/auth/users/assign-manager?developer_id=&manager_id=` and updates the
  row in place.
- Top-right filter: **All / Assigned / Unassigned** (client-side).

```
┌──────────────────────────────────────────────────────────────┐
│  Manage Devs        [ All ][ Assigned ][ Unassigned ]  ⟳     │
│  Developer        Squad      Manager                         │
│  Ananya Iyer      ai         ✔ Aarav Kapoor                  │
│  Lucas Bernardo   ai         [ Assign a manager… ▾ ]         │
└──────────────────────────────────────────────────────────────┘
```

### Tab — Create Manager (`components/tech/CreateManager.tsx`)

Form (name, username, email, phone, gender, department, password) that calls
`POST /api/v1/auth/admin/create-manager`. The new manager is written to the
`managers` collection with `role: "manager"` and can immediately log in and be
selected in the Manage Devs assign dropdown.

## `/tech/data-explorer` — `components/tech/DataExplorer.tsx`

> ⚠️ **This is the most powerful — and most dangerous — surface in the system.**

Calls the Auth Admin Data Explorer endpoints to:

- List collections
- Browse documents with regex filter
- Update fields in place
- Add new fields to docs

**Hard requirements** (currently partially met):

- Must be RBAC-gated to `tech` role at the **service** (not just frontend)
- Every write must produce an `audit_logs` entry
- Read-only on `audit_logs` (don't edit history)
- Banner: "You are editing production data. All actions are logged."

See [[13 - Yet to Implement/Backend - Auth - Data Explorer Hardening]].

## `/tech/users`

- List of every user across all 3 silos
- Filter by role
- "Unlock extension" button → clears `whitelist.machine_id`
- "Resend extension_id" button (planned)

## `/tech/devices` (planned)

Manage hardware locks at the device level (see also `scripts/approve_devices.py`).
