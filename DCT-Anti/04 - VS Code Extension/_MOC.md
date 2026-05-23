---
tags: [moc, extension]
---

# 04 — VS Code Extension · Map of Content

The developer-facing data collector. Hardware-anchored, snapshot-bearing.

## Pages

- [[Overview]]
- [[Activation Flow]]
- [[Telemetry Collector]]
- [[Telemetry Sender]]
- [[Snapshotter]]
- [[Commands & Status Bar]]
- [[Settings]]
- [[Hardware Lock (SHA-HWID)]]
- [[SHEC Sync Protocol]]

## Code path

`extension/` (TS, compiled to `out/`).

- `package.json` — manifest
- `src/extension.ts` — activate / deactivate
- `src/telemetry/{collector,sender,snapshotter}.ts`
- `src/registration/RegistrationView.ts`
- Build: `npm run compile` → `out/`
- Distributable: `extension/adt-extension-1.1.0.vsix`
