---
tags: [simulation-mode, ux]
status: implemented
---

# Sim Mode — Embedded IDE Panel

## Implementation status: ✅ Done

File: `frontend-nextjs/src/components/sim/IDEPanel.tsx`

---

## Why NOT Monaco (Phase 1 decision)

The original design spec called for Monaco editor. In Phase 1 we chose a custom VS Code lookalike instead for three reasons:

1. **No SSR complications** — Monaco requires `dynamic(() => import(...), { ssr: false })`, adding bundle complexity. Our custom div renders server-side with zero issues.
2. **No heavy dependency** — Monaco is ~2MB. A styled `<div>` is zero bytes.
3. **Full pixel control** — we replicate every VS Code dark UI detail we care about without fighting Monaco's theming API.

For investor demos, the result is visually indistinguishable. If Phase 2 needs real code editing, Monaco can be added then.

## Visual anatomy

The panel replicates VS Code Dark+ layout:

```
┌──────────────────────────────────────────────────────┐
│ ▌ Tab bar  ●  users.py                     [1E2030]  │  36px
├──────────────────────────────────────────────────────┤
│ Breadcrumb: app/routers/users.py            [171923]  │  22px
├──────────────────────────────────────────────────────┤
│  1  from fastapi import APIRouter, HTTPException      │
│  2  from app.db import get_db                         │
│  3                                                    │
│  4  router = APIRouter()              [editor body]   │
│  5                                                    │
│ ...                                        [0d0f14]  │
│                                          [minimap→]  │
├──────────────────────────────────────────────────────┤
│ ● live · alice@sim       Python  UTF-8  ADT Ext ✓    │  22px
└──────────────────────────────────────────────────────┘
```

- **Tab bar** (`#1E2030`): single tab, active border in `--brand` (`#7c6fe0`)
- **Breadcrumb** (`#171923`): full file path, 11px dimmed
- **Editor body** (`#0d0f14`): line numbers + code, `JetBrains Mono` or system fallback
- **Minimap** (right edge, 60px): decorative only — random width bars in `rgba(255,255,255,0.04–0.12)`, enough to look plausible
- **Status bar** (`#1a1d2e`): LIVE badge, language, encoding, extension marker

## Syntax tokenizer

`IDEPanel.tsx` ships a minimal Python/TypeScript tokenizer — no external library. It processes code line-by-line in this order:

1. **Comment** (remainder of line after `#` / `//`) → `#6a9955` (VS Code green)
2. **String literals** (`'...'`, `"..."`, backtick) → `#ce9178` (VS Code orange)
3. **Decorator** (`@word` at line start) → `#dcdcaa` (VS Code yellow)
4. **Keywords** (`from import def async await return if raise…`) → `#569cd6` (VS Code blue)
5. **Everything else** → `#cdd6f4` (light grey)

Sufficient for FastAPI Python and React TypeScript — the two languages in the demo script.

## Typing animation

`SimDemo.tsx` types text character-by-character by appending to `displayedCode` state:

```ts
// Inside runStep() — simplified
for (const char of step.typedText) {
  typed += char;
  patch({ displayedCode: baseCode + typed });

  const jitter = step.forceFraud ? 0 : (Math.random() * 40 - 20);
  const msPerChar = 60_000 / (wpm * 5);
  await sleep(msPerChar + jitter);

  if (char === '\n') await sleep(180); // breath before newlines
}
```

**Jitter (±20ms)** makes the typing look human. When `forceFraud=true` (Bob's scenario), jitter is set to `0` — perfectly uniform WPM — which is what Fusion's anomaly detector catches.

**WPM defaults:** Alice at 75 WPM, Bob at 80 WPM (slightly faster, also suspicious for a "developer" with zero variance).

## LIVE badge

The status bar's left section shows a `●` indicator:

- **Normal state:** `● live · alice@sim` in dim grey
- **On ping emit:** badge glows `#7c6fe0` for 100ms, then fades back to grey over 600ms

Implemented via `pingFlash` prop: `SimDemo` sets it `true` briefly whenever a particle is spawned, `IDEPanel` applies inline color transitions.

## Per-keystroke pings

Every ~25 characters, `SimDemo` emits a ping (spawns an `IDE→GW` particle and sets `pingFlash: true`). This corresponds to the real extension's 30-second window containing ~23 keystrokes at 75 WPM.

## File switching

`SimDemo` sets `fileName` and `displayedCode` at step boundaries. When step 6 (Bob) loads, `IDEPanel` immediately shows the new file and filename tab. No animation — file tabs snap, they don't slide.

## Phase 2 upgrade path

When Monaco is needed (e.g., interactive customer trials), swap `IDEPanel` for a `MonacoIDEPanel` with the same props interface. SimDemo doesn't care which editor renders the code — it just passes `displayedCode` and reads nothing back.
