---
tags: [extension, ux]
---

# Commands & Status Bar

## Commands (Command Palette)

| Command ID | Title | What it does |
|:-----------|:------|:-------------|
| `adt.register` | ADT: Register Developer | Opens registration webview (planned) |
| `adt.status` | ADT: View My Stats | Opens read-only stats panel showing last 24h batches + skill changes |
| `adt.connectAccount` | (runtime) | Prompts for `extension_id`, attempts hardware lock |
| `adt.disconnect` | (planned) ADT: Disconnect | Clears local state. Server-side lock remains until tech admin clears. |

## Status bar item

- Position: **Right**, priority 100
- Possible states:

| State | Icon | Text | Tooltip |
|:------|:-----|:-----|:--------|
| Not registered | `$(warning)` | ADT — register | Click to register |
| Connecting | `$(sync~spin)` | ADT… | Handshake in progress |
| Streaming | `$(pulse)` | ADT | Last sync: 28s ago |
| Backoff | `$(warning)` | ADT — retry | Network error; retrying in 30s |
| Locked elsewhere | `$(error)` | ADT — locked | Contact your tech admin |
| Final-sent | `$(check)` | ADT | (only seen briefly at shutdown) |

## Notifications

- **Once on startup**: machine ID (truncated for screen-sharing safety) + status
- **Every 5 min**: open task count (only if > 0)
- **On hardware mismatch**: error toast with "Open Docs" action
- **On 5 consecutive failures**: warning toast suggesting `/system-health` check

## Webview panels (planned)

- `adt.status` should open a side panel showing:
  - Live ping count (1m / 5m / 1h)
  - Last batch result (skills mutated, +/-)
  - Direct link to the developer's `/dashboard`

See [[10 - UX & UI/Dashboard Layouts - Developer]] for the dashboard side; this extension panel is the in-IDE companion.
