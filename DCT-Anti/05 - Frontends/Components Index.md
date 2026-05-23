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

## `ui/LoadingScreen.tsx`

- Generic full-page loader with optional message

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

## Not yet built (priority order)

| Component | Used by | Owner |
|:----------|:--------|:------|
| `dashboard/SkillRadar.tsx` | `/dashboard`, `/project-manager/squad/{id}` | — |
| `dashboard/SkillTrend.tsx` | `/dashboard` | — |
| `pm/SquadPulseCard.tsx` | `/project-manager` | — |
| `pm/CandidateVectorMatch.tsx` | task wizard | — |
| `pm/InfluenceGraph.tsx` | `/project-manager/leaderboards` | uses xyflow |
| `dev/AssessmentRunner.tsx` | `/dashboard`, blocked on Task service |
| `sim/SimModeSwitcher.tsx` | global | — see [[11 - Simulation Mode/Mode Switcher Design]] |
| `sim/EmbeddedIDE.tsx` | `/sim`, `/demo` | — see [[11 - Simulation Mode/Sim Mode - Embedded IDE Panel]] |

See [[10 - UX & UI/Component Library]] for the design spec.
