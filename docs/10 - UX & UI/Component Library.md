---
tags: [ux]
---

# Component Library

> Shared primitives. Built on Tailwind + Radix. Each lives under `src/components/ui/`.

## Primitives (Radix-based)

- `Button` — variants: primary, secondary, ghost, danger
- `Input` — text, number, password, search
- `Select`, `Combobox` — searchable
- `Dialog` — modal
- `Sheet` — side drawer
- `Tabs` — horizontal + vertical
- `Tooltip` — keyboard accessible
- `Popover` — non-modal hover/click
- `Dropdown` — menu
- `Toast` — bottom-right, stacks
- `Switch`, `Checkbox`, `Radio`
- `Slider` — single + range
- `Accordion`
- `Progress`, `Spinner`, `Skeleton`
- `Badge` — semantic variants

## Compound (ADT-specific)

- `SkillRadar` — 8-axis radar, accepts `skills` + `compareSkills` (for vector match viz)
- `SkillTrend` — sparkline of skill confidence over time
- `SquadPulseCard` — one dev card on PM dashboard
- `CandidateVectorMatch` — task vector vs dev vector visualization
- `InfluenceGraph` — xyflow-based PageRank visualization
- `AssessmentRunner` — single-attempt UI with cryptographic submit
- `AuditRow` — one row in the Live Audit HUD with action-specific rendering
- `DataExplorerGrid` — Mongo collection browser
- `SimModeSwitcher` — toggles Real ↔ Sim (with mandatory delay + confirmation)
- `EmbeddedIDE` — Monaco-driven faux IDE for Sim Mode
- `PipelineFlow` — animated diagram of telemetry → fusion → THG

## Composition rules

1. **Every primitive accepts `className`** — for tailwind override
2. **Compound components compose primitives** — never go around them
3. **Variants via `class-variance-authority`** — single source of variant logic
4. **Refs forwarded everywhere** — for focus management
5. **Stories in Ladle / Storybook** — every primitive has a doc page

## What's NOT in the library

- Page-specific layouts (those live in `app/.../page.tsx`)
- One-off charts (build with recharts directly until pattern repeats 3×)
- Marketing components — those go in a `marketing/` directory, separate
