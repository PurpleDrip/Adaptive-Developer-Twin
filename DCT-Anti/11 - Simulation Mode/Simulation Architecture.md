---
tags: [simulation, architecture]
---

# Simulation Architecture

To create a seamless investor demonstration, Simulation Mode integrates all three planes of ADT into a single web page.

## Component Overview

```
┌────────────────────────────────────────────────────────┐
│              [ SIMULATION MODE DASHBOARD ]             │
├──────────────────────────┬─────────────────────────────┤
│                          │                             │
│   Simulated IDE Iframe   │    Live Auditing Stream     │
│   (Typing code...)       │    (Processing telemetry...)│
│                          │                             │
├──────────────────────────┴─────────────────────────────┤
│                                                        │
│               Real-Time Twin Dashboard                 │
│               (Updating skill radar charts...)         │
│                                                        │
└────────────────────────────────────────────────────────┘
```

1. **Simulated IDE (Left Panel)**: A customized Monaco Editor instance that automatically types out code files, simulating active development inside an IDE.
2. **Telemetry Log Stream (Right Panel)**: A visual ledger showing simulated telemetry JSON packets being generated and pushed to `/telemetry/ingest` in real-time.
3. **Durable Sync (Bottom Panel)**: A live radar chart mapping the Developer's Skill Twin. As the code is typed in the Monaco Editor, the Radar Chart updates in real-time.
