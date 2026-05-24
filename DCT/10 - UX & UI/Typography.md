---
tags: [ux]
---

# Typography

## Families

- **UI** — `Inter` (variable), system fallback
- **Code / data** — `JetBrains Mono` (variable), `Menlo`, `Consolas`
- **Display (sim mode)** — `Space Grotesk`

## Type scale (base 16)

| Token | Size | Line | Use |
|:------|:----:|:----:|:---|
| `xs` | 12 | 16 | timestamps, chips |
| `sm` | 13 | 18 | labels, table cells |
| `base` | 15 | 22 | body |
| `md` | 17 | 24 | subhead |
| `lg` | 20 | 28 | section title |
| `xl` | 24 | 32 | page title |
| `2xl` | 32 | 40 | hero (rare) |
| `display` | 48 | 56 | Sim Mode hero |

## Weights

- 400 — body
- 500 — emphasis
- 600 — section titles
- 700 — page titles, key metrics in HUD
- 800+ — Sim Mode display only

## Numeric tabular

For numbers in tables and HUDs (where alignment matters), use `font-variant-numeric: tabular-nums`. Never let "47" jump width when it becomes "147."

## Microtypography rules

- **Use the en-dash** for ranges: `09:00–17:00`
- **Use ellipsis char** `…` not `...`
- **Always wrap units**: `42 ms` (with NBSP)
- **Currency aligned right** in tables; mixed text aligned left
- **Don't bold whole sentences** — bold the noun, not the verb
