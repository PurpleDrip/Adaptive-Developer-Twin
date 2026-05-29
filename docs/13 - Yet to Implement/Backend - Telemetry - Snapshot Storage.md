---
tags: [yet-to-implement, p0, security, reliability]
status: pending
priority: P0
estimate: 4 days
---

# Backend — Telemetry — Snapshot Storage

## Why
Today the extension can upload base64 zip in the request body. This is (a) memory-pressure on the API server and (b) SSRF-able if Fusion later downloads via URL.

## Acceptance criteria
- [ ] Extension calls `POST /telemetry/snapshot-url {size}` → server issues a **signed S3 (or compatible) URL** + `snapshot_id`
- [ ] Extension PUTs zip directly to the signed URL
- [ ] Extension's `/ingest` sets `workspace_snapshot_url: snapshot_id` (server-internal opaque)
- [ ] Server-internal resolver maps `snapshot_id` → real S3 URL (signed) for Fusion
- [ ] Max size enforced at signed-URL issuance (50 MB default)
- [ ] Snapshot bucket has 7-day TTL by default
- [ ] Bucket SSE-KMS enabled

## Files involved
- `backend/telemetry/app/routers/telemetry.py` (new `/snapshot-url` endpoint)
- `backend/telemetry/app/services/snapshot_store.py` (new — S3 client)
- `backend/fusion/app/routers/fusion.py` (resolve snapshot_id internally)
- `extension/src/telemetry/snapshotter.ts` (new upload flow)
- IaC: S3 bucket + lifecycle policy

## Tracked from
[[08 - Security & Compliance/Code Snippet & Snapshot Safety]] · [[12 - Expert Review/Top Risks (Ranked)#13]] · [[12 - Expert Review/Security Loopholes#5]]
