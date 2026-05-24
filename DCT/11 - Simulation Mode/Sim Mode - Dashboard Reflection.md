---
tags: [simulation-mode]
---

# Sim Mode — Dashboard Reflection

The right-hand panel. A miniaturized [[Dashboard Layouts - Developer|Developer dashboard]] for the active persona that updates as the pipeline finishes a step.

## What's in it

- **Radar** (8 axes, ~280 × 280)
- **"What just changed"** ticker — the last 3 skill changes with `±delta`
- **Persona meta** — name, primary domain, last sync ago
- **Influence rank** mini-card (when EVC ran)

## Updates

WS push `dashboard_reflected` arrives from Monitoring after THG completes:

```ts
visualizationBus.subscribe("dashboard_reflected", ({ persona, skills }) => {
  radar.morphTo(skills, { duration: 350 });
  ticker.prepend({ skills_changed: diff(prevSkills, skills) });
  prevSkills = skills;
});
```

The radar morph uses an SVG `<animate>` on each axis polygon point — `350 ms` calm easing.

## Annotation float

When a single skill's strength jumps notably (e.g., `+0.04`), a floating label appears next to its radar axis:

```
   backend
   0.78 ─→ 0.82  +0.04
```

Floats up `+12 px` over `1200 ms`, fades out at the end.

## Multi-persona switch

The demo may switch personas between steps ("now let's look at Bob…"). Switching:

1. Fade the current radar out `200 ms`
2. Pivot the persona name + meta
3. Fade the next radar in `300 ms`
4. The ticker resets — no spill of one persona's history into another's

## Why "reflection"?

This is the part where the cinematic story lands. We've shown the IDE, we've shown the pipeline doing work — but the audience cares about the **outcome**: did the Twin learn? The dashboard reflection answers that visibly.

## Performance

- Recharts can re-render at 60 fps for an 8-axis radar with morph — verified.
- All persona switches preload textures (avatars) at step boundary to avoid layout shifts.
