---
tags: [ux-ui, layout]
---

# Dashboard Layouts - PM

The Project Manager view `/project-manager` is the **Squad Orchestration Control Center**. PMs analyze team output, identify burnout risks, and assign tasks via vector matching.

## Key Sub-components

### 1. Burnout & Velocity Risk Panel (VDA-Oversight)
- **Visual Presentation**: Interactive Scatter plots showing developers on two axes:
  - **X-axis**: Telemetry Velocity (Commit velocity/WPM).
  - **Y-axis**: Burnout Risk Index (derived from late-night commits and sliding telemetry windows).
- **Amber Warning System**: Any developer drifting into the upper-right quadrant triggers a soft pulsing amber overlay, prompting the manager to balance workload.

### 2. CSA Candidate Vector Matcher
- **Interactive Matching Flow**:
  - The PM selects an unassigned task.
  - The PM clicks "Match Candidates."
  - The interface displays the top 5 candidates with vector percentage matches:
    ```
    ┌──────────────────────────────────────────────────┐
    │ Recommended Candidates for [Dockerize Gateway]   │
    ├──────────────────────────────────────────────────┤
    │ 1. John Doe   [94% Fit] (Mid Level · DevOps 0.8) │
    │ 2. Alice Jane [82% Fit] (Senior · Devops 0.9)    │
    └──────────────────────────────────────────────────┘
    ```
  - **Visual Detail**: Highlight the "stretch fit" candidate, matching a developer who is 15% below threshold but seeking that skill pathway.
