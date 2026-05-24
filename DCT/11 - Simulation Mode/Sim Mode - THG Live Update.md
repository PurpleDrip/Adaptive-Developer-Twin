---
tags: [simulation-mode]
---

# Sim Mode — THG Live Update

The "THG" pipeline node visualizes graph mutation.

## What's shown

When a skill update fires, the THG node:

1. Pulses
2. Briefly expands to show a **mini graph snippet**: the affected Developer node with the touched Skill edges
3. The touched edge's weight bar updates (e.g., `backend: 0.78 ━━━━━━━━ 0.82 ━━━━━━━━━` morph)

```
                ┌──────────────┐
                │ THG          │
                │ ┌──┐         │
                │ │AL│  ━.82━ backend  ←─ glow
                │ └──┘  ━.34─ database
                │       ━.55─ ml
                └──────────────┘
```

## Mini-graph rendering

A small `xyflow` instance inside the THG node:

- 1 dev node (the persona)
- 4–6 skill nodes (the persona's top skills)
- Edges with the strength as label

On update:

- The touched edge glows for `400 ms`
- The label transitions from `before` → `after` over `350 ms`
- All other edges dim slightly so the eye finds the change

## Multi-skill updates

A single batch can touch multiple skills. The mini-graph animates them in **sequence** (50 ms apart) so the eye reads them, not as a simultaneous flash.

## "Decay applied" badge

If the blend formula triggered with a notable decay (e.g., last update was 2 weeks ago), show a small "↓ decay" badge briefly. Educates the audience that the math is real.

## Cross-link

Real-mode update math: [[02 - System Architecture/Data Flow - Skill Update#Update math]] and [[07 - Algorithms/Temporal Decay Model]].
