---
tags: [ux]
---

# Dashboard Layouts — Project Manager

## Goal

Squad orchestration. Eight people, eight twins, one screen.

## Layout (1440 px)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ADT · carol (Backend Squad · 8 devs)               [+ New task] [⋮]    │
├─────────────────────────────────────────────────────────────────────────┤
│ Squad pulse                                                             │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                                         │
│ │alice│ │bob  │ │chad │ │dee  │                                         │
│ │  ⟨radar⟩ ↑.04 │ │ ⟨radar⟩ │ │ ⟨radar⟩ -.02 │ │ ⟨radar⟩ │              │
│ │30s ago│ │5m ago│ │1h ago│ │2d ago│  (color: green/amber/red)         │
│ │2 open│ │0    │ │5 open│ │1    │                                       │
│ │burn .1│ │.2  │ │.4 ⚠ │ │.0  │                                        │
│ └─────┘ └─────┘ └─────┘ └─────┘     (4 more...)                         │
├─────────────────────────────────────────────────────────────────────────┤
│ ┌── Squad velocity ─────────────┐ ┌── AI suggestions ──────────────┐   │
│ │ ◉ done   ◉ in progress         │ │ Allocation suggests:           │   │
│ │ ──█──▆──▇──█──█──▆──█──        │ │  • alice → task-1031 (.91)     │   │
│ │ wk1 wk2 wk3 wk4 wk5 wk6 wk7    │ │  • bob → task-1029 (.84)       │   │
│ │ 12 closed last week  ↑3        │ │ Why? [Explain]                 │   │
│ └────────────────────────────────┘ └────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│ Recent assessments                                                      │
│ │ alice  · backend mid · pass 0.78 · skill +0.04 · May 21              │
│ │ chad   · db basics   · fail 0.42 · skill -0.01 · May 19 · [Review]   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Sections

### Squad pulse

Each dev → card with:

- Mini-radar (svg, 8 axes, ~120 px)
- Last sync ago (color: green <1 h, amber <24 h, red >24 h)
- Open task count
- Burnout score (when [[07 - Algorithms/VDA-Oversight|VDA]] ships) with ⚠ on ≥0.5

Click a card → [[Routes - Project Manager#/project-manager/squad/{dev_id}|deep dive]].

### Squad velocity

Bar chart of weekly completed tasks. Hover → list of tasks completed that week.

### AI suggestions

Recommender output: "Given these open tasks and dev availability, here are the matches we'd make." Each → [Accept] [Reject] [Explain].

Empty state: "No new suggestions. Try adding tasks or wait for the next allocation cycle."

### Recent assessments

Outcome list. Click → assessment detail.

## New task flow

`+ New task` opens a sheet:

```
┌── New task ─────────────────────────────┐
│ Title        [_____________________]    │
│ Description  [_____________________]    │
│              [_____________________]    │
│ Required skills:                        │
│   backend  [▓▓▓▓▓▓░░░░] 0.6             │
│   database [▓▓░░░░░░░░] 0.2             │
│   + Add skill                           │
│ Due          [____/____/____]           │
│ Priority     ( ) low (•) normal ( ) high│
│                                         │
│ [Preview candidates]  [Save as draft]   │
└─────────────────────────────────────────┘
```

After "Preview candidates": a candidate panel slides in showing top 5 squad members ranked by [[07 - Algorithms/CSA-Matching]] score with SHAP rationale on hover.

## HRM extensions

For `role=hrm`, add:

- "Org" tab with cross-squad leaderboards
- "Hiring fit" page (paste job description → top candidates from full THG)
- Aggregated VDA across the org (no individual scores without consent)
