---
tags: [moc, yet-to-implement, done]
---

# Done

> Completed punch-list items, archived here when their status flips to `done`.

---

## Frontend — Remove Legacy Vite App ✅

**Completed:** 2026-05-28

`frontend/` (Vite + React app) deleted. No live routes referenced it. No docker-compose reference existed. The Next.js app in `frontend-nextjs/` is the sole frontend.

Original: [[Frontend - Remove Legacy Vite App]]

---

## Simulation Mode — Phase 1 (self-contained frontend demo) ✅

**Completed:** 2026-05-28

Route `/sim` live in `frontend-nextjs`. Fully self-contained — no backend required. 7-step scripted demo with typing animation, pipeline particle system, Fusion fraud scenario, and dashboard radar morphs.

Files delivered:
- `src/app/sim/page.tsx`
- `src/components/sim/SimDemo.tsx` (Demo Driver + orchestration)
- `src/components/sim/IDEPanel.tsx` (custom VS Code lookalike)
- `src/components/sim/PipelinePanel.tsx` (SVG pipeline + particles)
- `src/components/sim/DashboardPanel.tsx` (radar + ticker)
- `src/lib/sim/types.ts`
- `src/lib/sim/demoScript.ts` (7-step recipe + personas)
- Landing page `/` — "Watch the Live Demo" gradient CTA added

Original tickets:
- [[Simulation - Embedded IDE Panel]]
- [[Simulation - Demo Driver Engine]]
- [[Simulation - Recipe Runner UI]]
- [[Simulation - Scripted Demo Driver]]

Phase 2 (backend-connected sim) remains open: [[Simulation - Mode Switch + Seed Data]].

---

## Extension — Secret Scanner (P0) ✅

**Completed:** 2026-05-28

`extension/src/secrets/scanner.ts` — client-side regex redaction before any `code_snippet` leaves the machine. 11 patterns covering AWS keys, GitHub PATs, JWTs, bearer tokens, private keys, Mongo URIs, high-entropy strings. Exports `scanForSecrets(text)` (returns redacted string) and `containsSecret(text)` (boolean). Integrated in `collector.ts` — every snippet passes through scanner before being included in the payload.

---

## Extension — Path Sanitization (P0) ✅

**Completed:** 2026-05-28

`extension/src/telemetry/collector.ts` — `DENY_PATH_PATTERNS` list (10 regex rules) blocks telemetry from `.env`, key/cert files, credential files, AWS/Docker config, `.npmrc`, service-account JSONs, etc. Sensitive paths are replaced with `<<SENSITIVE_FILE>>` in `active_file`. No snippet is extracted from denied paths.

---

## Extension — Offline Buffer (P1) ✅

**Completed:** 2026-05-28

`extension/src/telemetry/buffer.ts` — FIFO persistent buffer backed by `globalStorageUri/adt_telemetry_buffer.json`. Cap: 1000 entries (oldest evicted). Exponential back-off replay (1 s → 2 s → 4 s … → 60 s max). Buffer count shown in status bar on failure. Drained automatically on next successful send.

---

## Extension — Native HWID / Dual Machine ID (P2) ✅

**Completed:** 2026-05-28

`extension/src/extension.ts` + `sender.ts` — sends both `vscode.env.machineId` (VS Code identity) and `machineIdSync()` from `node-machine-id` (BIOS/motherboard UUID) on all auth calls. Backend `hardware-lock` and `validate-extension` endpoints updated to accept and store `native_hwid`. `TelemetryIngestDTO` and `TelemetryRawDocument` include `native_hwid` field.

---

## Extension — Hot Heartbeat Reload (P1) ✅

**Completed:** 2026-05-28

`sender.ts` — `fetchRuntimeConfig()` hits `/monitoring/system-config` on every tick and reads `heartbeat_interval_seconds`. If the value changes, a notification is shown and the new interval takes effect immediately (no restart). Also reads `is_monitoring_paused` and `shec_handshake_interval_ms` in the same call.

---

## System Config — Dead Fields Wired (P1) ✅

**Completed:** 2026-05-29

All three previously stored-but-unread system config fields are now enforced:

- **`is_monitoring_paused`** — Extension skips heartbeat sends and shows "Monitoring paused" notification on state change. Batch processor skips the entire run when paused. Both resume automatically when unpaused.
- **`shec_handshake_interval_ms`** — Drives a `setInterval` in the extension (`sender.ts`) for periodic SHEC re-handshakes, independent of the heartbeat loop. Timer is reset live if the value changes.
- **`office_network_whitelist`** — `IPWhitelistMiddleware` added to `backend/gateway/app/main.py`. Blocks `POST /api/v1/telemetry/telemetry/ingest` from IPs not matching any CIDR entry. Whitelist is cached 5 min from monitoring service. Honours `X-Forwarded-For`.

---

## Fusion — Internal Server Error Bug Fix ✅

**Completed:** 2026-05-29

`backend/fusion/app/routers/fusion.py` — `_build_fusion_result()` called `reliability.get(...)` on a value that is a `float` (returned by `compute_composite_reliability()`), causing `AttributeError: 'float' object has no attribute 'get'` → HTTP 500 → batch processor stored `"error": "Internal Server Error"`. Fixed by using `float(reliability)` directly and deriving `is_reliable = reliability_score >= 0.8`.

Second fix: `check_human_jitter` was called with `[avg_wpm] * 5` (identical values) → always zero std dev → always flagged as `bot_detected`. Now uses actual `wpm_values` list from the batch summary; falls back to 3-element list only when fewer than 3 real samples exist.

---

## Extension — VSIX Packaging Scripts ✅

**Completed:** 2026-05-29

`extension/package.json` — added `npm run package` (stable) and `npm run package:pre` (pre-release) scripts using `npx @vscode/vsce`. Output goes to `../releases/` (outside extension folder to avoid circular zip reference). `.vscodeignore` added to exclude `src/`, test output, config files, and the `dist/` folder from the package.

`@vscode/vsce` added to `devDependencies`.

---

## Frontend — VSIX Download: Dynamic Latest File ✅

**Completed:** 2026-05-29

`frontend-nextjs/src/app/api/download-extension/route.ts` — Next.js API route that reads the `releases/` folder, picks the newest `.vsix` by modification time, and streams it as a file download with correct `Content-Disposition`. `SuccessStep.tsx` download button updated from hardcoded dead path `/downloads/adt-extension.vsix` to `/api/download-extension`. Path is configurable via `RELEASES_PATH` env var.

---

## Developer Dashboard — Leaderboard Self-Entry ✅

**Completed:** 2026-05-29

`frontend-nextjs/src/app/dashboard/page.tsx` — Global Leaderboard always shows the current developer:

- **In top 10**: entry tagged `isSelf: true`, highlighted with blue background + `YOU` badge + blue avatar.
- **Not in top 10**: top 10 shown normally, then a dashed `··· your position ···` separator, then the developer's own row with their actual rank (`#42` from full leaderboard position or analytics `overall_rank`) + `YOU` badge.

Score uses `overall_rank_percentile / 100` from the analytics summary as composite score proxy.
