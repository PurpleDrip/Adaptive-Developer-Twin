---
tags: [frontend, ux]
---

# Routes — Project Manager

## `/login?role=project_manager`

Standard polymorphic login → resolves in `managers` collection → redirect to `/project-manager`.

## `/project-manager` (Home)

The **Squad Orchestration center**.

Sections:

- **Squad pulse** — for each direct report:
  - Avatar + name
  - 8-axis mini-radar (sparkline)
  - Last sync timestamp (color-coded: green < 1h, amber < 24h, red > 24h)
  - Open task count
  - Burnout risk badge (P1 — once VDA is implemented)
- **Squad velocity** — completed tasks / week (rolling 8 weeks)
- **AI suggestions** — "Allocation Engine suggests X for Y" cards (from Recommender — currently stubbed)
- **Recent assessments** — assessment outcomes by squad member

## `/project-manager/tasks/new`

Task creation wizard:

1. **Define** — title, description, due date
2. **Required skills** — chip-picker with weight slider (0.0 → 1.0) per skill
3. **Preview candidates** — POST `/api/v1/task/match` — squad-scoped top 5
4. **Confirm** — POST `/api/v1/task/create` + `POST /assign` for the chosen dev

Component idea: a **Vector Match Visualization** — the chosen dev's skill vector overlaid on the task's required-skill vector, with a percentage match displayed. See [[10 - UX & UI/Dashboard Layouts - PM]].

## `/project-manager/squad/{dev_id}`

Deep dive on one direct report:

- Full skill radar with history (last 90 days)
- All audit entries for this dev (paginated)
- Assessment history
- Tasks assigned + completion ratio
- "Issue assessment" button → wizard

## `/project-manager/leaderboards`

Cross-squad rankings (within the PM's allowed scope):

- By skill (backend, frontend, etc.)
- By influence (PageRank from THG)
- By recent growth (delta over last N weeks)

## HRM-only extensions (`/project-manager/org`)

When `role=hrm`:

- Cross-squad analytics
- Org-wide leaderboards
- Hiring fit-finder (paste a job description → get top candidates from THG)

## State

Currently: page-local fetches. Should migrate to a query layer (React Query) with `staleTime: 30s` for THG reads. Tracked: [[13 - Yet to Implement/Frontend - React Query Migration]].
