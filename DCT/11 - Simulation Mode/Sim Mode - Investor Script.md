---
tags: [simulation-mode]
---

# Sim Mode — Investor Script

> The 5-minute pitch demo recipe. Memorized by the presenter; encoded as a JSON recipe for the Demo Driver.

## Recipe shape

```json
{
  "name": "Investor Demo · 5min",
  "personas": ["sim-alice", "sim-bob"],
  "steps": [
    {
      "id": "01-setup",
      "duration_ms": 6000,
      "persona": "sim-alice",
      "caption": "Alice opens VS Code. The ADT extension is locked to her machine. Hardware anchoring means this telemetry can only come from her.",
      "actions": [
        { "kind": "load_file", "name": "app/routers/users.py", "lang": "python", "content": "from fastapi import APIRouter\\n\\nrouter = APIRouter()\\n\\n@router.get('/users/{id}')\\nasync def get_user(id: str):\\n    return {}\\n" },
        { "kind": "highlight_pipeline_node", "node": "IDE" }
      ]
    },
    {
      "id": "02-typing-backend",
      "duration_ms": 10000,
      "persona": "sim-alice",
      "caption": "She types a FastAPI endpoint. Every 5 minutes in prod (10 seconds here), her pings batch and flow into Fusion.",
      "actions": [
        { "kind": "type", "text": "    user = await db.users.find_one({'id': id})\\n    if not user:\\n        raise HTTPException(404)\\n    return user", "wpm": 90 },
        { "kind": "emit_pings", "count": 6, "interval_ms": 1500 }
      ]
    },
    {
      "id": "03-fusion",
      "duration_ms": 8000,
      "persona": "sim-alice",
      "caption": "Fusion runs CodeBERT on her snippet. Reliability check passes — her typing has human jitter. Backend strength rises.",
      "actions": [
        { "kind": "trigger_batch", "persona": "sim-alice" },
        { "kind": "highlight_pipeline_node", "node": "FUS" }
      ]
    },
    {
      "id": "04-thg",
      "duration_ms": 6000,
      "persona": "sim-alice",
      "caption": "THG blends the new evidence with her existing twin. Decay handles past skill — her old backend score gets refreshed.",
      "actions": [
        { "kind": "highlight_pipeline_node", "node": "THG" }
      ]
    },
    {
      "id": "05-dashboard",
      "duration_ms": 5000,
      "persona": "sim-alice",
      "caption": "Her dashboard reflects in real time. Other devs see the same thing on their own dashboards.",
      "actions": [
        { "kind": "highlight_pipeline_node", "node": "DASH" }
      ]
    },
    {
      "id": "06-pivot-bob-fraud",
      "duration_ms": 8000,
      "persona": "sim-bob",
      "caption": "Now Bob — let's see what happens if telemetry looks suspicious. Zero-variance keystrokes — that's a bot. Reliability drops, fraud_flag fires, THG is NOT updated.",
      "actions": [
        { "kind": "emit_pings", "count": 6, "interval_ms": 1500, "wpm_constant": 80 },
        { "kind": "trigger_batch", "persona": "sim-bob", "force_fraud": true }
      ]
    },
    {
      "id": "07-close",
      "duration_ms": 6000,
      "caption": "Hardware lock, server-side fusion, single-attempt assessments, audit log, decay model — every layer protects the Twin from manipulation. That's the source of truth.",
      "actions": [
        { "kind": "switch_panel", "to": "audit_hud" }
      ]
    }
  ]
}
```

## Total budget

7 steps × avg 7 s = ~50 s of action + narration. Plus ~30 s of presenter intro and Q&A buffer = a tight **5-minute demo**.

## Backup plan

If anything breaks on stage:

1. Presenter clicks `⏭` to skip the broken step
2. Continues with next narration as if intended
3. Worst case: switch to **prerecorded video** (kept on disk at `media/demo-fallback.mp4`)

The kill switch ([[Safe-Mode Guarantees#10. There is a kill switch]]) freezes the page in a clean state.

## A/B variants

Have two recipes:

- `investor-positive.json` — All happy path; Alice grows her backend
- `investor-fraud.json` — Centers on fraud detection (Bob's bot scenario)

Choose based on the audience. Tech-deep VCs love `fraud`. Strategy / opportunity VCs love `positive`.
