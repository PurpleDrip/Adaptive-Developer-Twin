---
tags: [extension]
---

# Settings

Defined in `extension/package.json` under `contributes.configuration`.

| Key | Type | Default | Purpose |
|:----|:-----|:--------|:--------|
| `adt.gatewayUrl` | string | `http://127.0.0.1:8000` | Backend gateway |
| `adt.extensionId` | string | `""` | Developer's ext_id (also in `context.secrets`) |

## Planned

| Key | Type | Default | Purpose |
|:----|:-----|:--------|:--------|
| `adt.heartbeatSeconds` | number | (server-driven) | Local override for dev mode only |
| `adt.snapshotEnabled` | boolean | `true` | Allow INITIAL/FINAL zip uploads |
| `adt.snippetEnabled` | boolean | `true` | Sample ±10 lines around cursor |
| `adt.excludeGlobs` | string[] | (see [[Snapshotter]]) | Extra patterns to exclude from snapshot |
| `adt.signOutOfHours` | string | "9-17 IST" | Don't collect outside this window |

## Why some settings are server-controlled

`heartbeatSeconds` is intentionally **not** a setting in this version — the tech admin owns that via [[03 - Microservices/Monitoring Service|/system-config]]. Letting a developer raise their own heartbeat would defeat anti-spoofing.

The Tech Admin UI ([[10 - UX & UI/Dashboard Layouts - Tech Admin]]) is the **only** place this is changed in prod.

## Reading config in code

```ts
const gw = vscode.workspace.getConfiguration('adt').get<string>('gatewayUrl')!;
```

Secret keys (`extension_id`):

```ts
await ctx.secrets.store('adt.extensionId', value);
const v = await ctx.secrets.get('adt.extensionId');
```

`vscode.SecretStorage` is OS-keychain-backed (Keychain on macOS, DPAPI on Windows, libsecret on Linux). **Do not** put `extension_id` in regular settings in prod.
