---
tags: [ux-ui, layout]
---

# Dashboard Layouts - Developer

The Developer interface `/dashboard` is designed around **Neural Twin Evolution**. It must display a developer's growth and skill vectors clearly, empowering self-growth rather than causing surveillance concern.

## UI Wireframe Grid Layout

```
┌────────────────────────────────────────────────────────┐
│  ADT  [Search]                     (Dev Profile Panel) │
├────────────────────────────────────────────────────────┤
│ ┌───────────────────────────┐ ┌──────────────────────┐ │
│ │                           │ │  Neural Twin Radar   │ │
│ │  Weekly Verified Tasks    │ │                      │ │
│ │  ┌─────────────────────┐  │ │        Frontend      │ │
│ │  │ CSS Redesign [Start]│  │ │     ML ┌───┐  DevOps   │ │
│ │  └─────────────────────┘  │ │        └───┘         │ │
│ │  ┌─────────────────────┐  │ │       Database       │ │
│ │  │ API Integration [x] │  │ │                      │ │
│ │  └─────────────────────┘  │ │ [Sync Telemetry Now] │ │
│ └───────────────────────────┘ └──────────────────────┘ │
│ ┌───────────────────────────┐ ┌──────────────────────┐ │
│ │  Next Recommended Skills  │ │ Global Org Rank      │ │
│ │  [React] [Rust] [GraphDB] │ │ #14 (98th percentile)│ │
│ └───────────────────────────┘ └──────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

## High-Density Radar HUD Component
- **Visualization Engine**: Responsive SVG Radar charts showing dual datasets:
  - **Outer Core (Filled Blue)**: Skill strength (decays over time if telemetry shows inactive usage).
  - **Inner Target (Dashed Green)**: Assessment requirements set by managers.
- **Dynamic Interaction**: Hovering over vertices launches a micro-tooltip displaying the specific CodeBERT confidence value (e.g. `Confidence: 94.2% · Derived from 8,421 SCM commits`).
