---
tags: [ux]
---

# Color System

> Tokens. Never raw hex in components.

## Neutrals (light mode)

```
neutral.50   = #fafafa  (page bg)
neutral.100  = #f4f4f5  (card bg)
neutral.200  = #e4e4e7  (border)
neutral.400  = #a1a1aa  (muted text)
neutral.700  = #3f3f46  (subhead)
neutral.900  = #18181b  (body)
```

## Brand (deep indigo)

```
brand.50   = #eef2ff
brand.300  = #a5b4fc
brand.500  = #6366f1  (primary)
brand.700  = #4338ca  (hover)
brand.900  = #312e81  (active)
```

## Semantic

```
success.500  = #16a34a
warning.500  = #f59e0b
danger.500   = #dc2626
info.500     = #0284c7
```

## Skill axes (radar / charts)

Each of the 8 skill axes has its own hue so they're distinguishable on a single chart:

```
backend    = #6366f1  (indigo)
frontend   = #ec4899  (pink)
devops     = #f59e0b  (amber)
ml         = #14b8a6  (teal)
neo4j      = #8b5cf6  (violet)
testing    = #10b981  (emerald)
database   = #0ea5e9  (sky)
security   = #ef4444  (red)
```

These hues are also used in [[02 - System Architecture/Sequence - Live Audit HUD|audit log]] action badges (`skill_update` colors by the skill).

## Dark mode

Invert the neutral ramp (`50↔900`); brand stays; semantic colors lift saturation by 10 %.

```
dark.bg        = #0a0a0b
dark.card      = #18181b
dark.border    = #27272a
dark.body      = #e5e5e5
dark.muted     = #a1a1aa
```

## Sim Mode accent

To make Simulation Mode visually unmistakable, an extra accent set:

```
sim.bg-gradient = linear(135deg, #6366f1 0%, #ec4899 100%)
sim.surface     = #0b0f1f  (deep navy)
sim.glow        = #6366f1aa (used for pulses)
sim.scanline    = rgba(255,255,255,0.04) (overlay texture)
```

See [[11 - Simulation Mode/Sim Mode - Screen Choreography]] for usage.

## Contrast targets

| Pairing | Min ratio |
|:--------|:---------:|
| body text on bg | 7:1 (AAA) |
| muted text on bg | 4.5:1 (AA) |
| icon on bg | 3:1 |
| primary CTA text on CTA bg | 7:1 |

All token pairs above meet AA at minimum. Verify with axe-core in CI ([[13 - Yet to Implement/Frontend - Accessibility CI]]).
