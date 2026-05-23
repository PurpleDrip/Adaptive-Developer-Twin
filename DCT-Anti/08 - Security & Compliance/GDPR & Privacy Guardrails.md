---
tags: [security, compliance]
---

# GDPR & Privacy Guardrails

ADT contains highly sensitive data, including developer habits, cursor velocity, active branches, and code intents. Compliance with GDPR, CCPA, and SOC2 is an essential requirement for shipping to enterprise tier-1 customers.

## Right to Erase (GDPR Article 17)

ADT implements a cascading deletion pipeline to ensure a developer's digital twin is completely and irreversibly scrubbed when requested.

```mermaid
flowchart TD
    A[Manager/Dev initiates Erase Request] --> B[Auth Service: Mark User as Deleted]
    B --> C[Mongo: Delete user/whitelist records]
    B --> D[Mongo: Scrub raw telemetry & batch metrics]
    B --> E[THG Neo4j: Delete Developer Node & Relationships]
    E --> F[Delete (d:Developer {id: user_id})]
    F --> G[Redis: Expire all active user sessions]
```

## PII Scrubbing Rules

To prevent developers from accidentally sending credentials, passwords, or confidential customer PII within IDE telemetry (such as in file edits, branch names, or telemetry strings):

1. **Local Redaction regex**: Pre-processing in the extension parses and redacts matching patterns for:
   - Credentials / API Keys (`sk-proj-...`, `AIzaSy...`, `AWS_ACCESS_KEY_ID=...`)
   - Personal information (Email patterns, IP addresses)
2. **Server-side check**: The Fusion Service runs a high-performance regex array to drop telemetry payloads containing obvious secrets before writing to `telemetry_raw`.

## Compliance Posture Summary

- **PII Storage**: Minimal. No phone numbers, zero raw code stores (only CodeBERT semantic embeddings are persisted).
- **Consent Logs**: User consent is explicitly collected on `/onboarding` and stored in Mongo with cryptographic signatures.
- **Audit Trails**: All GDPR erasure requests emit a signature in Mongo `audit_logs` with the hash of the initiating manager.
