---
tags: [ux]
---

# Design Tokens

> Single source of truth — Tailwind config + a `tokens.ts` shared with charts. Never use raw hex in components.

## Spacing

```
xs   = 4px
sm   = 8px
md   = 16px
lg   = 24px
xl   = 32px
2xl  = 48px
3xl  = 64px
```

## Radii

```
none = 0
sm   = 4px
md   = 8px
lg   = 12px
xl   = 16px
full = 9999px (chips)
```

## Elevation (shadow)

```
e0   = none
e1   = 0 1px 2px rgba(0,0,0,0.06)
e2   = 0 2px 4px rgba(0,0,0,0.08)
e3   = 0 4px 12px rgba(0,0,0,0.10)
e4   = 0 8px 24px rgba(0,0,0,0.14)   (modals)
e5   = 0 16px 48px rgba(0,0,0,0.20)  (sim mode overlays)
```

## Z-index

```
base       = 0
sticky     = 10
dropdown   = 100
modal      = 1000
toast      = 2000
sim-overlay = 3000
```

## Motion durations

```
instant = 0ms       (state flip)
fast    = 120ms     (hover)
base    = 200ms     (most transitions)
calm    = 350ms     (skill radar morph)
slow    = 600ms     (page-level fade)
demo    = 1200ms    (sim mode beats)
```

Easing: `cubic-bezier(.22, .61, .36, 1)` for "calm-out"; `cubic-bezier(.5, 0, .75, 0)` for "sharp-in".

## Borders

```
border-default  = 1px solid token(neutral.200)
border-focus    = 2px solid token(brand.500)
border-error    = 1px solid token(danger.500)
```

## Breakpoints

```
sm:  640px
md:  768px
lg:  1024px
xl:  1280px
2xl: 1536px
```

The Tech Admin HUD is **desktop-first** (1280+); the Developer dashboard works down to `md`.

See [[Color System]] for the palette and [[Typography]] for type tokens.
