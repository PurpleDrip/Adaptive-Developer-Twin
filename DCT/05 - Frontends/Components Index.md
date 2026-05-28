---
tags: [frontend, ux]
---

# Components Index

> Every reusable component, what it does, where it's used. Keep alphabetized.

## `RoleCard.tsx`

- **Where**: `src/components/`
- **Used on**: `/` landing
- **Purpose**: Big call-to-action card per role (Developer / PM / Tech)
- **Props**: `{ role, title, description, icon, onClick }`

## `sim/DashboardPanel.tsx` ✅

- **Where**: `src/components/sim/`
- **Used on**: `/sim`
- **Purpose**: Right panel of the simulation screen — 8-axis radar (recharts), skill bars with animated widths, "What just changed" ticker
- **Props**: `{ persona, skills: SkillMap, ticker: TickerEntry[] }`

## `sim/IDEPanel.tsx` ✅

- **Where**: `src/components/sim/`
- **Used on**: `/sim`
- **Purpose**: Custom VS Code dark theme editor lookalike. Shows code being typed char-by-char, LIVE ping badge, syntax highlighting (Python + TypeScript), minimap
- **Props**: `{ fileName, code, pingFlash, isTyping, lang? }`

## `sim/PipelinePanel.tsx` ✅

- **Where**: `src/components/sim/`
- **Used on**: `/sim`
- **Purpose**: Center panel — SVG pipeline with 6 nodes (IDE→GW→TEL→FUS→THG→DASH), animated particles via RAF, Fusion result label, batch bubble, fraud-blocked THG visual
- **Props**: `{ activeNode, particles, fusionLabel, batchBubble, onParticleTick }`

## `sim/SimDemo.tsx` ✅

- **Where**: `src/components/sim/`
- **Used on**: `/sim` (page entry)
- **Purpose**: Main orchestrator for Simulation Mode. Owns all sim state, runs the 7-step Demo Driver, handles playback controls (Play/Pause/Next/Prev/Restart), renders the 3-column layout + top/bottom bars
- **No props** (top-level component)

## `registration/AnalysisHUD.tsx`

- Shows the GitHub project analysis progress during registration
- Polls `/api/v1/auth/users/profile/{user_id}` for `project_analysis_status` (planned field) and re-renders progress bars

## `registration/SuccessStep.tsx`

- Final step of `/register`
- Displays the freshly issued `extension_id` (one-time)
- Copy button + "Download QR" (for mobile install)
- "Open VS Code & paste" CTA

## `registration/ValidationIcon.tsx`

- Per-field icon: spinner, checkmark, X, info
- Drives async validation UX via `/api/v1/auth/users/validate?field=&value=`

## `tech/DataExplorer.tsx`

- Mongo browser (collection list → docs grid → edit cell modal)
- Filter UI with regex toggle
- Audit banner

## `tech/LiveAuditHUD.tsx`

- WebSocket-driven audit feed
- Pause / resume
- Filter by action / user_id
- Color-coded action types
- CSV export

## `ui/LoadingScreen.tsx`

- Generic full-page loader with optional message

## Not yet built (priority order)

| Component | Used by | Notes |
|:----------|:--------|:------|
| `dashboard/SkillRadar.tsx` | `/dashboard`, `/project-manager/squad/{id}` | — |
| `dashboard/SkillTrend.tsx` | `/dashboard` | — |
| `pm/SquadPulseCard.tsx` | `/project-manager` | — |
| `pm/CandidateVectorMatch.tsx` | task wizard | — |
| `pm/InfluenceGraph.tsx` | `/project-manager/leaderboards` | uses xyflow |
| `dev/AssessmentRunner.tsx` | `/dashboard` | blocked on Task service |
| `sim/SimModeSwitcher.tsx` | global | Phase 2 — see [[11 - Simulation Mode/Mode Switcher Design]] |

See [[10 - UX & UI/Component Library]] for the design spec.
