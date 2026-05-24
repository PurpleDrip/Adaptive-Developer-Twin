---
tags: [simulation-mode]
---

# Sim Mode — Fusion Live View

The "FUS" node in the pipeline panel is the visual climax of every step.

## What's shown

When Fusion is processing a sim batch, the FUS node:

1. Pulses with brand color (`600 ms`)
2. Shows a 3-line label that updates as the call returns:
   ```
   Fusion · v2.0-top-tier
   reliability: 0.94 ✓
   skill_updates: backend +0.04, db +0.01
   ```
3. Optionally, a small inset chart shows the **reliability factors** as a tiny bar chart (keystroke_padding, jitter, snippet_variety, ...)

## When a fraud_flag would fire

If sim Demo Driver intentionally generates a "suspicious" batch (e.g., zero-variance WPM), the FUS node turns **danger-red** instead of brand, and the label reads:

```
Fusion · v2.0-top-tier
reliability: 0.31 ⚠
fraud_flag triggered
```

THG is **not** updated for this batch (matches real behavior). The pipeline visualization shows the THG node greyed-out for this step. Powerful demo moment.

## Implementation

The visualization subscribes to two WS events from Monitoring:

- `fusion_started` — pulse begins
- `fusion_completed` — label settles, pulse fades

```ts
visualizationBus.subscribe("fusion_started", ({ batch_id, persona }) => {
  fusNode.startPulse();
});
visualizationBus.subscribe("fusion_completed", ({ batch_id, reliability, updates, fraud_flag }) => {
  fusNode.setLabel({ reliability, updates, fraud_flag });
  fusNode.endPulse(fraud_flag ? "danger" : "brand");
});
```

## Cross-link

Visit a real example of the FUS computation in [[03 - Microservices/Fusion Service#The /run pipeline]] and the math in [[07 - Algorithms/Bayesian Skill Fusion]].
