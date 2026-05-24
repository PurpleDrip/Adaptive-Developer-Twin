---
tags: [yet-to-implement, p0, security]
status: pending
priority: P0
estimate: 3 days
---

# Extension — Secret Filter

## Why
The extension currently sends `code_snippet` from anywhere the cursor is, including `.env`, key files, and bad commits with hardcoded API keys. Risk: customer secrets propagate to our DB.

## Acceptance criteria
- [ ] File-path allowlist excludes `.env*`, `*.pem`, `*.key`, `*.crt`, `id_rsa*`, `*credential*`, `*secret*`, `.git/`, `.aws/`, `.docker/config.json`, `.npmrc`
- [ ] Snippet content scanner regex: AWS keys, GitHub PAT, JWT, high-entropy strings
- [ ] Match → replace with `<<REDACTED:{type}>>` in the outgoing payload
- [ ] Local emit event: "secret redacted" — small toast to dev
- [ ] No telemetry sent at all when the active file matches the path-deny list
- [ ] Workspace snapshotter applies same rules before zipping

## Files involved
- `extension/src/telemetry/collector.ts` (collect + redact)
- `extension/src/telemetry/snapshotter.ts` (exclude in walk + scan)
- `extension/src/secrets/scanner.ts` (new — regex catalog)
- `extension/src/secrets/scanner.test.ts` (new — unit tests)

## Notes
Pair with [[Backend - Telemetry - Server-Side Secret Scan]] (defense in depth).

## Tracked from
[[08 - Security & Compliance/Code Snippet & Snapshot Safety]] · [[12 - Expert Review/Top Risks (Ranked)#3]]
