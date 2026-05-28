---
tags: [simulation-mode]
status: implemented
---

# Sim Mode — Fusion Live View

## Implementation status: ✅ Done

File: `frontend-nextjs/src/components/sim/PipelinePanel.tsx`

---

## What's shown

When Fusion processes a batch, the FUS node in the SVG pipeline:

1. Gets an active highlight (border color → `#7c6fe0`, background tinted with brand color, glow ring)
2. A 3-line result label fades in below the node (via `fusionLabel` state prop):

```
Fusion · v2.0-top-tier
reliability: 0.94 ✓  backend +0.04 · database +0.01
⟶ THG write queued
```

## Fraud scenario

When `fusionLabel.fraud === true`, the entire color scheme flips to danger-red:

```
Fusion · v2.0-top-tier
reliability: 0.31 ⚠  fraud_flag triggered
⟶ THG write blocked
```

Additionally:
- The FUS→THG edge keeps its dashed stroke but dims
- The THG node opacity drops to `0.3` with a `✕` badge
- The DASH node is never pulsed — audience visually sees the chain break

## Implementation detail

The label is pure SVG `<text>` and `<rect>` elements rendered inside `PipelinePanel.tsx`. No DOM overlay — everything is in the `300×540` SVG viewport.

```tsx
{fusionLabel && (
  <g>
    <rect x={30} y={344} width={240} height={46} rx={6}
      fill={fraud ? 'rgba(224,95,95,0.08)' : 'rgba(124,111,224,0.08)'}
      stroke={fraud ? 'rgba(224,95,95,0.3)' : 'rgba(124,111,224,0.3)'} />
    <text x={150} y={358} textAnchor="middle" fontSize={9} fontFamily="monospace"
      fill={fraud ? '#e05f5f' : '#a09ad8'}>
      Fusion · v2.0-top-tier
    </text>
    <text x={150} y={372} textAnchor="middle" fontSize={9} fontFamily="monospace"
      fill={fraud ? '#e05f5f' : '#7c6fe0'}>
      {fraud ? `reliability: 0.31 ⚠  fraud_flag triggered` : `reliability: 0.94 ✓  backend +0.04`}
    </text>
    <text x={150} y={384} textAnchor="middle" fontSize={8} fontFamily="monospace" fill="#5a6480">
      {fraud ? '⟶ THG write blocked' : '⟶ THG write queued'}
    </text>
  </g>
)}
```

## State flow

`SimDemo.tsx` sets `fusionLabel` when the fusion step fires:

```ts
const fusionLabel: FusionLabel = {
  reliability: step.fusionReliability ?? 0.94,
  fraud: step.forceFraud ?? false,
  updates: step.skillDeltas ?? {},
};
patch({ fusionLabel });
```

`PipelinePanel` reads it as a prop — no local state, no subscriptions.

## Cross-link

The real computation this visualizes: [[03 - Microservices/Fusion Service#The /run pipeline]] and [[07 - Algorithms/Bayesian Skill Fusion]].
