---
tags: [expert-review, ux-ui]
---

# UX-UI Audit

A review of the visual layer across both frontends (`frontend` and `frontend-nextjs`) has revealed design drift and functional inconsistencies.

## Findings & Discrepancies

### 1. The Dual Frontend Problem
- The codebase contains both a legacy Vite + React frontend (`frontend/`) and a modern Next.js frontend (`frontend-nextjs/`). 
- **Issue**: Vite pages do not implement the unified Dark/Glassmorphic styling used in Next.js, leading to confusion during demos.
- **Expert Recommendation**: Freeze the legacy `frontend/` directory and route all deployments directly through `frontend-nextjs/`.

### 2. High-Density Radar Readability Gaps
- **Issue**: The Radar HUD displays up to 15 skills simultaneously. The labels overlap on smaller resolution screens, rendering the graph unreadable.
- **Expert Recommendation**: Implement multi-tier skill grouping (e.g. cluster Frontend, Backend, and DevOps into outer rings that expand when clicked).

### 3. Live Audit HUD Accessibility
- **Issue**: The streaming logs on `/tech/dashboard` flow too fast during telemetry spikes, causing eye strain and preventing admins from tracking individual hashes.
- **Expert Recommendation**: Add an automated grouping feature that collapses identical repetitive logs into single counters (e.g., `[TELEMETRY_INGEST] user_1 (x45)`).
