---
tags: [ux-ui, design-tokens]
---

# Design Tokens & Principles

ADT requires a stunning visual presentation. Traditional layouts look boring and fail to engage users. We prioritize premium, rich, dynamic aesthetics (Dark Mode defaults, glassmorphic styling, and HSL custom colors).

## Core Color Palettes (HSL)

| Token Name | HSL Value | Application |
|:---|:---|:---|
| `--bg-master` | `hsl(224, 25%, 6%)` | Dark background base |
| `--bg-card` | `rgba(30, 41, 59, 0.45)` | Glassmorphism card base with blur |
| `--accent-core` | `hsl(263, 70%, 50%)` | Vibrant violet for primary interactive states |
| `--accent-teal` | `hsl(172, 66%, 50%)` | Neural Twin sync success / healthy indicators |
| `--accent-amber` | `hsl(38, 92%, 50%)` | Alert state, high burnout threat indicators |
| `--border-glass` | `rgba(255, 255, 255, 0.08)`| Subtle glass border overlays |

## Key Design Principles

1. **Glassmorphism Base CSS**:
   All core containers must utilize:
   ```css
   .glass-panel {
     background: var(--bg-card);
     backdrop-filter: blur(16px) saturate(180%);
     border: 1px solid var(--border-glass);
     border-radius: 12px;
   }
   ```
2. **Modern Typography**:
   Avoid generic sans-serif fonts. Use the **Outfit** or **Inter** family from Google Fonts for high legibility in numeric screens.
3. **No Ugly Stubs / Placeholders**:
   Always generate fully realized assets, clean gradients, and realistic telemetry numbers.
