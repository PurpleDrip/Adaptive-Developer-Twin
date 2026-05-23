---
tags: [simulation, pipeline]
---

# Data Pipeline Simulation

Behind the scenes of Simulation Mode, a mock telemetry loop is triggered to bypass the normal 5-minute batch intervals, ensuring real-time responsiveness.

## Pipeline Blueprint

```mermaid
sequenceDiagram
    autonumber
    participant IDE as Monaco IDE Simulator
    participant GW as Gateway (Demo Port)
    participant Tel as Telemetry (Instant mode)
    participant Fus as Fusion (Simulated)
    participant THG as THG Service (Neo4j)
    participant DB as MongoDB / UI
    
    IDE->>GW: Emit keystrokes & state change (Every 2s)
    GW->>Tel: Ingest telemetry payload
    Note over Tel: Bypasses batch queue in Demo mode
    Tel->>Fus: POST /fusion/user_id/run (Instant)
    Fus->>Fus: CodeBERT analyzes code intent
    Fus-->>Tel: Return skill strength delta
    Tel->>THG: Update graph skills (Neo4j)
    Tel->>DB: Write audit_logs
    Note over DB: WS Pub/Sub broadcasts to front-end
    DB-->>IDE: Update radar charts in real-time
```

## Special Sim Parameters
- **Batch Interval override**: Changed from `5 minutes` to `2 seconds` to make animations responsive.
- **Complexity booster**: In Sim mode, each line of code parsed contributes a multiplier to the CodeBERT weight engine to illustrate instant capability increases.
