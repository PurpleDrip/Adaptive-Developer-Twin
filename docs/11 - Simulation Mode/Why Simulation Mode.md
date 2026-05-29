---
tags: [simulation-mode]
---

# Why Simulation Mode

## The problem

The product's killer demo is **the whole pipeline at once**:

> "Watch — Alice is typing in her IDE… these pings reach the ingest service… they batch every 5 minutes… Fusion computes confidence… THG updates… her dashboard radar morphs. All in real time."

But:

- A real 5-minute batch cycle is **too slow** for a 30-min pitch.
- A real developer's machine isn't on stage.
- Investors / judges don't care about reality — they care about **the cinematic story**.

So we build **Simulation Mode**: a UI mode that plays the cinematic story on a sped-up internal clock against a sandboxed copy of the real services, with a faux IDE panel embedded in the page.

## What it is

- A separate URL: `https://demo.adt.example.com` (sim env) or `/sim` route (sim within prod, feature-flagged)
- A scripted "演出" (performance) — `Demo Driver` plays a sequence of actions
- All real services run against a **sim tenant** in the same DBs (or separate sim DBs)
- A `mode = "sim"` flag at every layer that:
  - Speeds up batch cycles (e.g., 10 seconds instead of 5 minutes)
  - Adds visible "live" effects (pulses, glowing edges) that don't exist in prod
  - Visualizes pipeline stages on screen

## What it is NOT

- ❌ A separate codebase
- ❌ A separate set of services
- ❌ A static recorded video
- ❌ A way to "fake" results in prod

It runs the **same code**, against the **same DBs structure**, with a **mode flag** that adjusts cadence and overlays visualization.

## Why one screen

Investor attention is finite. If they have to look at 3 monitors to understand the system, the demo failed.

The Sim Mode screen layout (see [[Sim Mode - Architecture]]) puts:

1. The IDE (left)
2. The pipeline visualization (center)
3. The dashboard reflection (right)

All visible simultaneously. The story moves left → center → right naturally.

## The threshold question: is it "rigged"?

**No, with caveats.**

- The Demo Driver is scripted (we choose what gets typed) — but Fusion really analyzes what was typed; THG really updates; the radar really morphs based on the real computation
- We **speed up** the batch cycle — a real prod batch happens every 5 min; Sim mode every 10 s
- We **highlight** events with overlays — those overlays don't exist in prod

If we showed an investor the same pipeline with their own code on a real-time clock, they'd see the same things just slower and less colorful.

## When NOT to use Sim Mode

- ❌ Sales call with a customer's actual production data
- ❌ Demos to engineers who'll deploy the system (show them Real Mode)
- ❌ Anything where the audience needs to trust the realism of the demo as evidence

Sim Mode is **for the story**, not the proof. See [[Safe-Mode Guarantees]].
