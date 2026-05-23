---
tags: [ux-ui, layout]
---

# Dashboard Layouts - Tech Admin

The Tech Admin portal `/tech` focuses on **Infrastructure Health, Telemetry Control, and Real-Time Event Streams**.

## Interface Components

### 1. Live Audit HUD
- **Real-time Streaming**: Powered by WebSockets connecting to the Monitoring Service (`/ws/audit`).
- **Aesthetic**: Custom dark slate logs with syntax-highlighted event pills:
  - `[AUTH_MUTATION]` in Violet
  - `[TELEMETRY_INGEST]` in Teal
  - `[FRAUD_DETECTION]` in pulsing Red
- **User controls**:
  - **Pause/Resume button**: Pauses current interface updates while maintaining the incoming WS buffer.
  - **Filter pill row**: Filters stream by user, event category, or risk score.

### 2. System-Config Controller
- **Dynamic Sliders**:
  - `Telemetry Heartbeat Interval (seconds)` (range: 5s to 300s).
  - `Batch Aggregation Timer (minutes)` (range: 1m to 60m).
- **Visual Action**: Adjusting sliders displays a green indicator highlighting the immediate cascading impact on projected MongoDB writes.
