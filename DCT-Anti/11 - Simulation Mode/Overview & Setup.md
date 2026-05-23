---
tags: [simulation, setup]
---

# Overview & Setup

The **Simulation Mode** is designed specifically for investors, judges, and clients to demonstrate the real-time feedback loops of the ADT platform without needing physical IDE plugins installed on their machines.

## Purpose of the Simulation
- Show how developer keystrokes and code complexity map directly to skills.
- Demystify the "black box" backend pipeline.
- Present a clear visual sequence of telemetry → fusion → THG update → dashboard sync.

## Launching the Simulation

1. **Bootstrap local environment**:
   ```bash
   python scripts/seed_production_demo.py --nuclear-reset
   ```
2. **Access Demo portal**:
   Open browser to `http://localhost:3000/demo` (or custom staging demo URL).
3. **Trigger Simulation Flow**:
   Choose from the pre-seeded simulation templates (e.g., "Developer John writes a React assessment" or "Developer Alice runs a complex Neo4j optimization").
