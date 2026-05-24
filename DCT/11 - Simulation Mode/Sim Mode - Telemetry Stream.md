---
tags: [simulation-mode]
---

# Sim Mode — Telemetry Stream

## What's different from Real Mode

| Aspect | Real | Sim |
|:-------|:-----|:----|
| Heartbeat interval | 30 s | 1 s |
| Batch interval | 5 min | 10 s |
| Pings come from | VS Code extension | Embedded IDE Demo Driver |
| Hardware lock | `vscode.env.machineId` | Hard-coded `sim-machine-001` |
| Auth-validate | full SHA-HWID check | sim tenant has pre-locked whitelist row |
| Snippet source | dev's real workspace | Monaco editor content |

## Synthetic identity

A handful of pre-seeded sim personas in the sim tenant:

```json
[
  { "user_id": "sim-alice",   "ext_id": "sim-ext-alice",   "machine_id": "sim-machine-001", "primary_domain": "backend"  },
  { "user_id": "sim-bob",     "ext_id": "sim-ext-bob",     "machine_id": "sim-machine-002", "primary_domain": "frontend" },
  { "user_id": "sim-carol",   "ext_id": "sim-ext-carol",   "machine_id": "sim-machine-003", "primary_domain": "devops"   },
  { "user_id": "sim-dee",     "ext_id": "sim-ext-dee",     "machine_id": "sim-machine-004", "primary_domain": "ml"       }
]
```

Their `whitelist` rows are pre-populated; their THG `Developer` nodes pre-created.

## Pipeline visualization triggers

Three events the Demo Driver emits to the local sim event bus drive the pipeline panel:

```ts
type SimEvent =
  | { type: "ping_sent", persona: string }
  | { type: "gateway_received", persona: string }
  | { type: "telemetry_stored", persona: string }
  | { type: "fusion_started", persona: string, batch_id: string }
  | { type: "fusion_completed", persona: string, batch_id: string, reliability: number }
  | { type: "thg_updated", persona: string, skill: string, before: number, after: number }
  | { type: "dashboard_reflected", persona: string };
```

Some come from the **client** (ping_sent — Driver emits before POST). Some come from a **WS push** from monitoring (fusion_started, thg_updated). The visualization layer subscribes to both and routes to the right pipeline node.

## Latency faking

Because sim cadence is 10 s and real cadence is 5 min, "the pipeline doing work" must visually take a beat — otherwise it looks instant. We **artificially delay** the WS pushes for the visualization (NOT the real computation):

```ts
function emitWithVisualDelay(event: SimEvent, ms = 800) {
  setTimeout(() => visualizationBus.push(event), ms);
}
```

So the user sees:

- 0.0s — particle leaves IDE
- 0.5s — particle arrives at Gateway, GW pulses
- 1.0s — particle arrives at Telemetry, TEL pulses
- 2.0s — Fusion pulses (the "work happens" beat)
- 3.0s — THG pulses
- 3.5s — Dashboard radar morphs

Each beat is long enough for narration but short enough to fit the demo budget.

See [[Latency Faking & Heartbeats]] for the full timing table.

## Telemetry payload validity

Sim pings are **valid Real-Mode telemetry** — they pass the same Pydantic validators. We're not bypassing validation; we're just generating well-formed payloads.

If the Real Mode validator changes, the sim Demo Driver MUST be updated too. CI test: assert that all `scripts/demo_telemetry.jsonl` fixtures parse via `TelemetryIngestDTO`.

Tracked: [[13 - Yet to Implement/Simulation - DTO Fixture Test]].
