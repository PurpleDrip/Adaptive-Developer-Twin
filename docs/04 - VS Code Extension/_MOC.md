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

- `package.json` — manifest + build scripts
- `src/extension.ts` — activate / deactivate, command registration
- `src/telemetry/collector.ts` — keystroke / WPM / git-branch / snippet collection; path deny-list; secret scanning
- `src/telemetry/sender.ts` — heartbeat loop, SHEC handshake, pause guard, buffer drain, runtime config fetch
- `src/telemetry/buffer.ts` — offline FIFO buffer (persistent, 1000-entry cap, exponential back-off replay)
- `src/telemetry/snapshotter.ts` — workspace zip snapshot
- `src/secrets/scanner.ts` — client-side secret redaction (11 regex patterns)
- `src/registration/RegistrationView.ts` — webview registration form

## Build & distribution

```powershell
cd extension
npm run compile        # TypeScript → out/
npm run package        # compile + vsce package → ../releases/adt-extension-{version}.vsix
npm run package:pre    # same but --pre-release flag
```

Distributable: `releases/adt-extension-1.1.0.vsix` (outside `extension/` to avoid circular packaging).
Served to developers via `GET /api/download-extension` (always returns latest `.vsix` in `releases/` by mtime).
