---
tags: [architecture]
---

# Data Flow — Registration

## Inputs

- `POST /api/v1/auth/users/register` with [[06 - Data Models/DTO - User Registration|UserRegistrationDTO]] body.

## Outputs

- 201 Created — `{ user_id, extension_id, status: "registered" }`
- Side effects:
  1. `users` doc inserted (Mongo)
  2. `whitelist` row inserted (Mongo) with `machine_id = null` (filled on first hardware lock)
  3. `Developer` node MERGEd in Neo4j
  4. Background: `POST /api/v1/fusion/analyze-project` per GitHub URL

## Sequence

```mermaid
sequenceDiagram
    autonumber
    participant FE as Web
    participant GW as Gateway
    participant A as Auth
    participant M as Mongo
    participant T as THG
    participant F as Fusion (bg)
    participant N as Neo4j

    FE->>GW: POST /auth/users/register (UserRegistrationDTO)
    GW->>A: register_user(dto, bg_tasks)
    A->>A: validate (length · regex · enum)
    A->>A: bcrypt hash password
    A->>A: generate user_id (uuid) · extension_id
    A->>M: INSERT users
    A->>M: INSERT whitelist {ext_id, machine_id: null}
    A->>T: POST /create-dev {dev_id, name, gender, primary_domain}
    T->>N: MERGE (d:Developer {id})
    T-->>A: 201
    A-->>GW: 201 {user_id, extension_id}
    GW-->>FE: 201
    par background per github_url
        A->>F: POST /analyze-project {user_id, github_url}
        F->>F: clone · AST · CodeBERT
        F->>T: POST /update (per detected skill)
        T->>N: MERGE (d)-[:HAS_SKILL]->(s)
    end
```

## Failure paths

| Failure | Behavior today | Should be |
|:--------|:---------------|:----------|
| Mongo unreachable | 500 to client; no row inserted | Same |
| THG unreachable | 201 returned but graph node missing → inconsistency | Compensating write or retry queue ([[13 - Yet to Implement/Backend - Auth - Saga for Registration]]) |
| Duplicate username | Pydantic + Mongo unique index → 400 | Same |
| GitHub URL 404 | Background task fails silently | Surface in `users.project_analysis_status` ([[13 - Yet to Implement/Backend - Auth - Project Analysis Status]]) |

## Validation rules

See [[06 - Data Models/DTO - User Registration]] for full schema. Highlights:

- `username` matches `^[a-zA-Z0-9_]+$`
- `password` length 8–128 (hashed before storage)
- `experience_level` enum: Intern / Junior / Mid / Senior / Lead / Principal
- `github_project_urls` ≤ 5

## Audit

This flow emits **two** audit log entries:

1. `action=user_registered`
2. `action=thg_developer_created`

(Currently only #2 is logged — gap in [[12 - Expert Review/Observability Gaps]].)
