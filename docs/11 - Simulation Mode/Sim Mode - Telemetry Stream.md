---
tags: [simulation-mode]
status: phase-1-implemented
---

# Sim Mode — Telemetry Stream

## Phase 1 (self-contained) vs Phase 2 (backend-connected)

### Phase 1 — no real API calls ✅

In Phase 1, there are **no HTTP requests**. "Telemetry" is entirely simulated by `SimDemo.tsx`'s step runner: particles are spawned on the React state, nodes pulse visually, and skill deltas are applied directly to the `skills` SkillMap — all in JavaScript, all in the browser.

There is no SHEC handshake, no `/ingest` call, no batch processor. The visual story is identical but the mechanics are local.

### Phase 2 — real backend (not yet built)

Phase 2 restores the original design: the Demo Driver POSTs to real telemetry services running against a sim tenant. The section below documents Phase 2 behavior for when that work begins.

---

## Phase 2 planned design

### What's different from Real Mode

| Aspect | Real | Sim |
|:-------|:-----|:----|
| Heartbeat interval | 30 s | 1 s |
| Batch interval | 5 min | 10 s |
| Pings come from | VS Code extension | Embedded IDE Demo Driver |
| Hardware lock | `vscode.env.machineId` | Hard-coded `sim-machine-001` |
| Auth-validate | full SHA-HWID check | sim tenant has pre-locked whitelist row |
| Snippet source | dev's real workspace | IDE panel content |
| API calls | real extension | `SimDemo.runStep()` |

### Synthetic identities

Pre-seeded sim personas in the sim tenant:

```json
[
  { "user_id": "sim-alice",  "ext_id": "sim-ext-alice",  "machine_id": "sim-machine-001", "primary_domain": "backend"  },
  { "user_id": "sim-bob",    "ext_id": "sim-ext-bob",    "machine_id": "sim-machine-002", "primary_domain": "frontend" },
  { "user_id": "sim-carol",  "ext_id": "sim-ext-carol",  "machine_id": "sim-machine-003", "primary_domain": "devops"   }
]
```

Their `whitelist` rows are pre-populated; their THG `Developer` nodes pre-created.

### Pipeline visualization triggers

In Phase 2, `SimDemo` subscribes to WS events from Monitoring and routes them to pipeline panel state:

```ts
type SimEvent =
  | { type: "ping_sent",           persona: string }
  | { type: "gateway_received",    persona: string }
  | { type: "telemetry_stored",    persona: string }
  | { type: "fusion_started",      persona: string, batch_id: string }
  | { type: "fusion_completed",    persona: string, batch_id: string, reliability: number }
  | { type: "thg_updated",         persona: string, skill: string, before: number, after: number }
  | { type: "dashboard_reflected", persona: string };
```

Some come from the **client** (ping_sent — SimDemo emits before POST). Some come from a **WS push** from Monitoring (fusion_started, thg_updated). The simulation layer subscribes to both.

### Latency faking

Because sim cadence is 10 s and real cadence is 5 min, events arrive quickly. We add visual delays so the audience can follow:

```ts
function emitWithVisualDelay(event: SimEvent, ms = 800) {
  setTimeout(() => visualizationBus.push(event), ms);
}
```

Visual beat: 0s ping → 0.5s GW → 1.0s TEL → 2.0s FUS → 3.0s THG → 3.5s DASH.

### Telemetry payload validity

Sim pings must be **valid Real-Mode telemetry** — they pass the same Pydantic validators. The Demo Driver constructs payloads from the IDE's actual content:

```ts
const ping = {
  extension_id: "sim-alice",
  machine_id:   "sim-machine-001",
  sync_type:    "DELTA",
  wpm:          75,
  keystrokes:   23,
  commands_executed: 0,
  idle_seconds: 0,
  active_file:  currentFile,
  languages_used: { python: 30 },
  code_snippet: currentCode,
  timestamp:    new Date().toISOString(),
};
```

Tracked: [[13 - Yet to Implement/Simulation - DTO Fixture Test]].
