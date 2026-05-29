---
tags: [dto]
---

# Cross-Service DTO Contracts

> Every DTO that crosses a service boundary. **Breaking changes here = breaking changes everywhere.** Versioning is required for prod (see [[13 - Yet to Implement/Backend - All - DTO Versioning]]).

## Auth ↔ Telemetry

### `POST /api/v1/auth/users/validate-extension`

Request:

```json
{ "extension_id": "uuid", "machine_id": "string" }
```

Response (200):

```json
{ "user_id": "uuid", "name": "string", "status": "active" }
```

Failure: 403 `{ detail: "Hardware mismatch" }` or 404 `{ detail: "Extension not found" }`.

## Telemetry ↔ Fusion

### `POST /api/v1/fusion/fusion/{user_id}/run`

Request: `FusionInputDTO` — see [[DTO - Telemetry Batch#aggregated_signals]].

Response:

```json
{
  "status": "fusion_complete",
  "user_id": "uuid",
  "engine_version": "v2.0-top-tier",
  "reliability_check": { "is_reliable": true, "reliability_score": 0.94 },
  "skill_updates": {
    "backend": { "strength": 0.82, "confidence": 0.91, "explanation": "..." },
    "frontend": { "strength": 0.45, "confidence": 0.78, "explanation": "..." }
  }
}
```

### `POST /api/v1/fusion/fusion/deep-audit`

Request: `{ user_id, workspace_snapshot_url }`.

Response (202):

```json
{
  "status": "baseline_established",
  "user_id": "uuid",
  "files_scanned": 124,
  "sampled_for_codebert": 15,
  "baseline_skills": { "backend": 0.6, "..": 0.1 }
}
```

## Fusion ↔ THG / Telemetry ↔ THG

### `POST /api/v1/thg/update`

Request: `SkillUpdateDTO`:

```json
{ "dev_id": "uuid", "skill_name": "backend", "strength": 0.82, "confidence": 0.91 }
```

Response (201):

```json
{ "status": "ok", "record": { "strength": 0.84, "confidence": 0.91, "updated": "ISO" } }
```

(Note: returned `strength` differs from request because of decay + blend.)

## Allocation ↔ Fusion

### `POST /api/v1/fusion/fusion/analyze-text`

Request:

```json
{ "text": "string" }  // or { "resume": "string" }
```

Response (200):

```json
{ "status": "success", "vector": { "backend": 0.74, "ml": 0.31, ... } }
```

## Allocation ↔ THG

### `GET /api/v1/thg/developers`

Response:

```json
[
  {
    "id": "uuid",
    "name": "string",
    "skills": [
      { "name": "backend", "strength": 0.82, "confidence": 0.91, "updated": "ISO" }
    ],
    "confidence": 0.86
  }
]
```

## Task ↔ Allocation

### `POST /api/v1/allocation/rank`

Request: `TaskAllocationRequest`:

```json
{
  "task_id": "uuid?",
  "title": "string",
  "description": "string",
  "required_skills": { "backend": 0.8 },
  "min_confidence": 0.3
}
```

Response (200):

```json
{
  "task_id": "uuid",
  "candidates": [
    { "dev_id": "uuid", "name": "string", "match_score": 0.91, "confidence": 0.87, "rationale": "..." }
  ],
  "algorithm": "CSA-Matching",
  "scoring_formula": "0.6*match + 0.2*conf + 0.2*base"
}
```

## Task ↔ Auth

### `GET /api/v1/auth/users/squad/{manager_id}`

Response:

```json
{ "manager_id": "uuid", "members": [ { "user_id": "uuid", "name": "string", "primary_domain": "string" } ] }
```

## Versioning policy (target)

- URL path prefix `/api/v1/` — stable for the life of the major version
- Breaking changes → `/api/v2/`
- Deprecate v1 with a 6-month overlap window
- Each service can be on a different major (as long as compose / k8s wires them up consistently)
