---
tags: [simulation-mode]
---

# Latency Faking & Heartbeats

## Cadence overrides

Sim Mode overrides three intervals via env vars + per-request flags:

| Real Mode | Sim Mode |
|:----------|:---------|
| `HEARTBEAT_INTERVAL_SECONDS=30` | `=1` |
| `BATCH_INTERVAL_MINUTES=5` | `=0.16` (10 s) |
| FUSION model warm-up | one-time at sim env startup |

## Beat timing table

For visual storytelling, every pipeline event has a deliberate delay before its visualization fires. This is "latency faking" — the underlying compute is fast; the **visualization** is paced.

| Event | Visual delay | Reason |
|:------|:------------:|:-------|
| `ping_sent` (from Driver) | 0 ms | instant — the cursor is at the IDE |
| `gateway_received` | 200 ms | reads as "request reached server" |
| `telemetry_stored` | 500 ms | reads as "DB wrote" |
| `fusion_started` | 800 ms after batch trigger | reads as "compute kicking off" |
| `fusion_completed` | 2000 ms after start | reads as "real work happening" |
| `thg_updated` | 2400 ms | one beat after fusion |
| `dashboard_reflected` | 3000 ms | the closing beat |

The audience sees a steady, readable cadence. The real compute could be 5× faster, but the eye can't track it.

## "Skip ahead" behavior

If a presenter clicks `⏭` mid-step, all in-flight delayed visualizations should:

1. Cancel pending `setTimeout`s
2. Snap the radar to its final state for that step
3. Move to the next step's setup

This is a **hard** UX requirement — the presenter must not be punished for clicking ahead.

## Real-mode immunity

Real Mode services **reject** any request with `mode=sim` or cadence-override params:

```python
@router.post("/ingest")
async def ingest(dto: TelemetryIngestDTO, request: Request):
    if request.app.state.env != "sim" and request.headers.get("X-Mode") == "sim":
        raise HTTPException(403, "Sim requests are not allowed on this environment.")
    ...
```

CI test asserts this on every push.

## Heartbeat configurability boundary

In Real Mode, only Tech Admins can change heartbeat via [[03 - Microservices/Monitoring Service|/system-config]]. The min is `5 s`, the max is `300 s`. Sim Mode bypasses these bounds (down to `1 s`) **only** because `state.env == "sim"`.

```python
def validate_heartbeat(value: int, env: str):
    if env == "sim":
        return value  # any
    if value < 5 or value > 300:
        raise ValueError("Heartbeat must be 5–300s in non-sim envs.")
    return value
```

## Frame rate budget

The full Sim Mode screen runs at 60 fps target:

- IDE — Monaco at 60 fps natively
- Pipeline panel — SVG + xyflow with throttled redraws
- Dashboard radar — Recharts with `<animate>` (svg native)
- Particles — small SVG circles with CSS `animation`

If any panel drops below 30 fps, profile and cut whichever animation is the slowest. The story matters more than the dazzle.
