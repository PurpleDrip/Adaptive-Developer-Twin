---
tags: [simulation-mode]
---

# Demo Data Recipes

> Catalog of pre-built demo flows. Each lives in `scripts/sim/recipes/<name>.json`.

## Recipes

### `investor-positive.json`

The happy-path 5-min demo. Alice grows backend; Bob fails fraud check. See [[Sim Mode - Investor Script]].

### `investor-org-influence.json`

10-min demo for HRM / Chief People Officer audiences.

- Persona: HRM at "Acme Corp"
- Walks through `/project-manager/leaderboards` and `/influence`
- Shows "knowledge hubs" — Alice and Carol both score high in backend; if Alice leaves, Carol is the bus-factor backup
- Concludes with hiring fit: paste a JD → see top candidates

### `dev-self-evolution.json`

5-min demo aimed at developer audiences (e.g., conf talk).

- Centered on `/dashboard` from a single dev's POV
- Shows growth across 14 days (sped up to 1 minute)
- Highlights "What changed today" + SHAP explanations
- Hammers the "evidence not vibes" principle

### `enterprise-security.json`

7-min demo for CISO audiences.

- Centered on Tech Admin HUD
- Walks through:
  - Hardware lock conflict (audit fires)
  - System config change with audit
  - Fraud flag in audit stream
  - Data Explorer (with the security disclaimers visible)
- Concludes with [[08 - Security & Compliance/_MOC]] checklist on screen

### `pm-task-allocation.json`

4-min demo for engineering manager audiences.

- Persona: PM
- Creates a task
- Sees CSA-ranked candidates
- SHAP rationale per top 3
- Hits "Assign" — audit fires; dev's `/dashboard` updates

## Recipe schema

```typescript
type Recipe = {
  name: string;
  personas: string[];
  audience: "investor" | "dev" | "manager" | "tech" | "ciso";
  total_estimated_ms: number;
  steps: Step[];
};

type Step = {
  id: string;                       // "01-setup"
  duration_ms: number;
  persona?: string;
  caption: string;
  actions: Action[];
};

type Action =
  | { kind: "load_file", name: string, lang: string, content: string }
  | { kind: "type", text: string, wpm?: number }
  | { kind: "emit_pings", count: number, interval_ms: number, wpm_constant?: number }
  | { kind: "trigger_batch", persona: string, force_fraud?: boolean }
  | { kind: "highlight_pipeline_node", node: string }
  | { kind: "switch_panel", to: string }
  | { kind: "switch_persona", to: string }
  | { kind: "wait", ms: number };
```

## Recipe authoring guidance

- Aim for **6–10 steps**. Fewer → boring; more → fatiguing.
- Each step should have **one concrete action** the audience can follow.
- Captions are **40–80 chars**. Read aloud in ~5 s.
- Step durations sum to your budget. Test on stage with a stopwatch.

## Adding a new recipe

1. Copy `investor-positive.json` to a new file
2. Edit per audience
3. Run locally with `npm run sim -- --recipe my-recipe.json`
4. Record yourself running it; iterate
5. PR with the new file + screenshot of final dashboard state

Tracked: [[13 - Yet to Implement/Simulation - Recipe Runner UI]].
