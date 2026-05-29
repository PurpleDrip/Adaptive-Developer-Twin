---
tags: [ux]
---

# Information Density

> Engineers want dense screens. Empty space is a luxury we owe to consumer apps, not internal tools.

## Density tiers

| Tier | Where | Lines visible | Padding |
|:-----|:------|:-------------:|:--------|
| **Sparse** | Landing, login, onboarding | 1 hero per fold | `2xl–3xl` |
| **Comfortable** | Developer `/dashboard` | 6–8 sections per fold | `lg` |
| **Dense** | PM `/project-manager` | 12+ data tiles per fold | `md` |
| **Cockpit** | Tech Admin HUD | Maximum visible without scrolling on 1440p+ | `sm` |

## Cockpit rules

- 4-column grid; tiles span 1, 2, or 3 columns
- Tables: 13 px tabular numerics, 28 px row height
- Live numbers update in place (no jumps)
- Sparklines inline where a full chart isn't warranted
- Sticky column headers when tables exceed fold

## How to add density without clutter

1. **Group by meaning, separate by line** — section dividers, not boxes everywhere
2. **Borders are louder than backgrounds** — prefer subtle bg lift to drawn borders
3. **One alignment, mostly** — left-align text, right-align numbers, that's it
4. **Color sparingly** — use brand color for one or two interactive accents per fold, semantic colors only for status
5. **Hide affordances on hover** — secondary actions don't need to scream

## Anti-patterns

- Charts at 600 px tall when a 200 px sparkline would do
- Two-column tables that could be one row of chips
- Lots of icons "to feel modern" — every icon must repeat (or replace) a word, never decorate
- Padding that exists "for breathing room" — verify with a stakeholder it's earning its keep
