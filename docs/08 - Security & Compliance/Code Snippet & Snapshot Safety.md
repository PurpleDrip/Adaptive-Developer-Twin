---
tags: [security, privacy]
---

# Code Snippet & Snapshot Safety

> The single highest-PII surface in the product. Developers' actual code passes through here.

## The risks

- **API keys** in `.env` accidentally pasted into code → snippet leaks them to fusion + storage
- **Customer data** in test fixtures (e.g., `users.json`) → snapshot leaks PII
- **Internal IP** — proprietary algorithms in the dev's code → exposure if our storage is breached

## Defenses (target)

### Layer 1 — Client-side allowlist

The extension's [[04 - VS Code Extension/Snapshotter|Snapshotter]] and [[04 - VS Code Extension/Telemetry Collector|Collector]] MUST exclude:

```
.env*
*.pem
*.key
*.crt
id_rsa*
*credential*
*secret*
*.kdbx
*.pfx
.git/
.aws/
.docker/config.json
.npmrc       (may contain auth tokens)
```

### Layer 2 — Client-side secret scanning

Before sending a snippet or zipping a file, run a regex sweep:

```regex
# AWS access keys
AKIA[0-9A-Z]{16}
# AWS secret
[A-Za-z0-9/+=]{40}
# GitHub PAT
ghp_[A-Za-z0-9]{36}
# Generic high-entropy 32+ char base64
[A-Za-z0-9/+]{32,}={0,2}
# JWT
eyJ[A-Za-z0-9_\-]+\.eyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+
```

Match → **redact** with `<<REDACTED:type>>` and continue.

### Layer 3 — Server-side scanning at ingest

Telemetry runs the same regex sweep at `/ingest`. If it finds a secret the client missed:

- Replace with redacted form
- Audit: `action: secret_redacted, source: server`
- (P1) Send an alert to the dev: "We detected and redacted a secret in your telemetry. Please rotate it."

### Layer 4 — At-rest encryption

- `telemetry_raw.code_snippet` — encrypted column (envelope encryption with KMS)
- Workspace snapshots in object storage — SSE-KMS
- Backups — encrypted at the volume level

### Layer 5 — Access control

- Only **Fusion** can decrypt snippets. No human reads them through the API.
- Tech Admin Data Explorer shows snippets as `<<encrypted>>` placeholder by default; explicit reveal requires double-RBAC + audit + manager-of-the-dev notification.

## What about the diff_payload?

The unified diff in `diff_payload` can also leak secrets. Same scanner applies.

## What about file paths?

A path like `/Users/alice/work/customer-acme-secret-project/src/main.py` leaks customer info via the path itself. Solution:

- Strip absolute paths client-side → store repo-relative paths only (`src/main.py`)
- Hash workspace root before send → use the hash as an opaque identifier

## What if the dev deliberately commits secrets?

That's a different problem — git secrets in the repo. Out of scope for ADT, but **we should not be the one that distributes** those secrets to a wider audience.

If we detect a secret in code that's also in git, we still redact it from telemetry and alert the dev to clean their repo.

## Today

- **None of layer 1–5 is implemented.** This is a **P0 gap**.

Tracked:
- [[13 - Yet to Implement/Extension - Secret Filter]]
- [[13 - Yet to Implement/Extension - Path Sanitization]]
- [[13 - Yet to Implement/Backend - Telemetry - Server-Side Secret Scan]]
- [[13 - Yet to Implement/Backend - Telemetry - Snapshot Encryption]]
