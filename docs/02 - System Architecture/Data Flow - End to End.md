---
tags: [architecture]
aliases: [End-to-End Flow]
---

# Data Flow — End to End

One developer's full lifecycle through the system. This is the canonical reference flow.

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer
    participant Web as Next.js UI
    participant GW as Gateway
    participant Auth as Auth · :8001
    participant THG as THG · :8004
    participant Ext as VS Code Ext
    participant Tel as Telemetry · :8002
    participant Fus as Fusion · :8003
    participant Mon as Monitoring · :8007
    participant UI2 as Tech Admin HUD

    rect rgb(240,248,255)
        note over Dev,THG: REGISTRATION
        Dev->>Web: fills /register
        Web->>GW: POST /api/v1/auth/users/register
        GW->>Auth: register_user(DTO)
        Auth->>Auth: validate · hash pw · gen ext_id
        Auth->>MONGO: INSERT users
        Auth->>MONGO: INSERT whitelist
        Auth->>THG: POST /create-dev
        Auth-->>Web: { user_id, extension_id }
        Note over Auth: background: POST {FUSION}/analyze-project (if github_urls)
    end

    rect rgb(255,250,240)
        note over Dev,Ext: ONBOARDING
        Dev->>Ext: install + open VS Code
        Ext->>Ext: prompt for extension_id
        Dev->>Ext: paste ext_id
        Ext->>GW: POST /auth/users/hardware-lock {ext_id, machine_id}
        GW->>Auth: hardware_lock
        Auth->>MONGO: UPDATE whitelist · set machine_id
        Auth-->>Ext: { locked: true, sync_type: INITIAL }
        Ext->>Ext: zip workspace · upload snapshot
        Ext->>GW: POST /telemetry/ingest (sync_type=INITIAL · workspace_snapshot_url)
        GW->>Tel: ingest_telemetry
        Tel->>Auth: POST /validate-extension
        Auth-->>Tel: ok
        Tel->>MONGO: INSERT telemetry_raw
        Tel->>Fus: POST /deep-audit (snapshot)
        Fus->>Fus: AST + CodeBERT
        Fus->>THG: POST /update (baseline skills)
    end

    rect rgb(245,255,245)
        note over Ext,THG: STEADY-STATE
        loop every 30s (heartbeat interval)
            Ext->>Ext: collect WPM, keystrokes, files, snippet
            Ext->>GW: POST /telemetry/handshake (state hash)
            GW->>Tel: handshake
            Tel-->>Ext: synchronized | mismatch
            Ext->>GW: POST /telemetry/ingest (sync_type=DELTA)
            GW->>Tel: ingest
            Tel->>MONGO: INSERT telemetry_raw
        end
        loop every 5 min (BATCH_INTERVAL_MINUTES)
            Tel->>Tel: BatchProcessor wakes
            Tel->>MONGO: SELECT unprocessed (limit 10k)
            Tel->>Tel: group by user · aggregate signals
            Tel->>Fus: POST /{user_id}/run (signals)
            Fus->>Fus: anomaly check · CodeBERT · Bayesian fuse · SHAP
            Fus-->>Tel: {reliability, skill_updates}
            loop per skill
                Tel->>THG: POST /update (skill update)
            end
            Tel->>MONGO: INSERT telemetry_batches
            Tel->>MONGO: UPDATE telemetry_raw SET processed=true
            Tel->>MONGO: INSERT audit_logs (per skill change)
            par fan-out
                Tel-->>Mon: PUBLISH audit:stream (Redis)
                Mon-->>UI2: WS push
            end
        end
    end

    rect rgb(255,245,255)
        note over Dev,Web: DASHBOARD READ
        Dev->>Web: opens /dashboard
        Web->>GW: GET /thg/skills/{user_id}
        GW->>THG: read with live decay
        THG-->>Web: skills + confidence
        Web->>Web: render Radar HUD
    end
```

## Sub-flows (deep dives)

- [[Data Flow - Registration]]
- [[Data Flow - Telemetry Pipeline]]
- [[Data Flow - Skill Update]]
- [[Data Flow - Task Allocation]]
- [[Sequence - Live Audit HUD]]
