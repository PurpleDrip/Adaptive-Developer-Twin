---
tags: [simulation-mode]
status: implemented
---

# Sim Mode — Dashboard Reflection

## Implementation status: ✅ Done

File: `frontend-nextjs/src/components/sim/DashboardPanel.tsx`

---

## What's in it

- **Persona card** — avatar, name, domain, "Neural Twin ● Active"
- **Radar chart** — 8-axis recharts `RadarChart`, ~220px tall, brand purple fill
- **Skill bars** — one bar per skill, `transition: width 350ms ease-out`
- **"What just changed" ticker** — last 3 skill changes with before/after deltas

## Updates

`DashboardPanel` is a pure display component — it has no local state. `SimDemo.tsx` passes `skills`, `ticker`, and `persona` as props. When `SimDemo` applies deltas and updates state, React re-renders `DashboardPanel` and the bars and radar morph.

```tsx
<DashboardPanel
  persona={state.persona}
  skills={state.skills}
  ticker={state.ticker}
/>
```

## Radar chart

Uses recharts `RadarChart` (already in `package.json`), same library as the real developer dashboard:

```tsx
<RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarData}>
  <PolarGrid stroke="rgba(255,255,255,0.08)" />
  <PolarAngleAxis dataKey="subject" tick={{ fill: '#5a6480', fontSize: 9 }} />
  <Radar name="Skills" dataKey="value"
    stroke="#7c6fe0" fill="#7c6fe0" fillOpacity={0.22} strokeWidth={1.5} />
</RadarChart>
```

The polygon morph happens automatically when `radarData` changes — recharts interpolates between old and new values. No SVG `<animate>` required.

## Ticker

```tsx
{ticker.slice(0, 3).map((entry, i) => {
  const delta = entry.after - entry.before;
  return (
    <div key={i}>
      <span>{delta >= 0 ? '▲' : '▼'}</span>
      <span>{SKILL_LABELS[entry.skill]}</span>
      <span>{(entry.before * 100).toFixed(0)} → {(entry.after * 100).toFixed(0)}</span>
      <span>{delta >= 0 ? '+' : ''}{(delta * 100).toFixed(0)}%</span>
    </div>
  );
})}
```

`▲` in `--brand` purple. `▼` in `--danger` red (for when decay is visualized in Phase 2).

## Persona switching

When `SimDemo` switches from Alice to Bob (step 6), the `persona` prop changes. `DashboardPanel` immediately re-renders with Bob's base skills and an empty ticker. There is no fade animation in Phase 1 — the panel snaps to the new persona. Phase 2 can add a `200ms/300ms` fade.

## Original spec vs implementation

| Spec | Phase 1 | Phase 2 |
|:-----|:--------|:--------|
| SVG `<animate>` on radar axes | recharts interpolation ✅ | Same |
| Floating `+0.04` annotation at axis vertex | Not built | Planned |
| `200ms/300ms` persona fade | Instant snap | Planned |
| WS push `dashboard_reflected` | Direct prop update | WS event |
| Influence rank mini-card | Not built | Planned |

## Performance

recharts re-renders the 8-axis radar at 60fps. Verified via React DevTools profiler — no unexpected re-renders. The `radarData` memo in `DashboardPanel` prevents recomputing on unrelated state changes.
