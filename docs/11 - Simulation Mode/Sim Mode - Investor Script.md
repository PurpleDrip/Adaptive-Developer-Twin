---
tags: [simulation-mode]
status: implemented
---

# Sim Mode — Investor Script

> The 7-step pitch demo. Encoded as `DEMO_STEPS` array in `frontend-nextjs/src/lib/sim/demoScript.ts`.

## Live script (as implemented)

```ts
// demoScript.ts — DEMO_STEPS

Step 01 — "01-setup"         persona: alice  duration: 5s
  Action: load app/routers/users.py (FastAPI skeleton)
  Caption: "Alice opens VS Code. The ADT extension is locked to her machine —
            hardware anchoring means this telemetry can only originate from her device."

Step 02 — "02-typing-backend"  persona: alice  duration: 12s
  Action: type ALICE_FILE_1.typed at 75 WPM with ±20ms jitter
  Action: spawn 5 ping particles (IDE→GW→TEL) every ~25 chars
  Caption: "She writes a FastAPI endpoint. Every 5 minutes in production
            (sped up to 10 seconds here), her keystrokes batch and flow into Fusion."

Step 03 — "03-fusion"          persona: alice  duration: 8s
  Action: show batch bubble (BATCH-YYYYMMDDHHM-alic)
  Action: TEL→FUS particle
  Action: fusionLabel { reliability: 0.94, updates: { backend: +0.04, database: +0.01 } }
  Action: FUS→THG particle, skills updated, ticker updated
  Caption: "Fusion runs CodeBERT on her snippet. Reliability check passes —
            her typing has human jitter. Backend strength rises from 0.78 → 0.82."

Step 04 — "04-thg"             persona: alice  duration: 6s
  Action: THG node highlighted
  Caption: "THG blends the new evidence with Alice's existing Twin. Temporal decay
            refreshes her scores — skills she hasn't used recently dim automatically."

Step 05 — "05-dashboard"       persona: alice  duration: 5s
  Action: DASH node highlighted
  Caption: "Her dashboard reflects in real time. The radar morphs as the Twin learns.
            Every developer in the org sees their own live Twin."

Step 06 — "06-fraud-bob"       persona: bob    duration: 10s
  Action: load components/Header.tsx (TypeScript)
  Action: type BOB_FILE_1.typed at 80 WPM with ZERO jitter (forceFraud=true)
  Action: TEL→FUS particle (red)
  Action: fusionLabel { reliability: 0.31, fraud: true }  →  THG BLOCKED
  Caption: "Now Bob — same pipeline, but his keystrokes have zero variance.
            That's a bot signature. Reliability drops to 0.31. Fraud flag fires.
            THG is NOT updated."

Step 07 — "07-close"           persona: alice  duration: 6s
  Action: all 6 pipeline nodes highlighted in sequence (IDE→GW→TEL→FUS→THG→DASH)
  Caption: "Hardware lock, server-side fusion, single-attempt assessments, audit log,
            temporal decay — every layer protects the Twin from manipulation.
            That is the source of truth."
```

## Persona data

| Persona | Base backend | Base frontend | Primary domain |
|:--------|:--------:|:----------:|:--------------|
| Alice Chen | 0.78 | 0.38 | Backend · Python · Neo4j |
| Bob Reeves | 0.44 | 0.71 | Frontend · TypeScript |

After step 3 (Alice's batch):
- `backend: 0.78 → 0.82` (+0.04)
- `database: 0.31 → 0.32` (+0.01)

## Code snippets used

### Alice — `app/routers/users.py` (Python, FastAPI)

Initial file (shown when step 1 loads):
```python
from fastapi import APIRouter, HTTPException
from app.db import get_db

router = APIRouter()

@router.get('/users/{id}')
async def get_user(id: str):
    return {}
```

Typed text (step 2):
```python
    db = await get_db()
    user = await db.users.find_one({'_id': id})
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    return {
        'user_id': user['_id'],
        'name': user['name'],
        'domain': user['primary_domain'],
    }
```

### Bob — `components/Header.tsx` (TypeScript/React)

Initial + typed text: a React `Header` component with props, className, and JSX — signals frontend skill domain.

## Total demo budget

7 steps × ~7s avg = ~50s of action. Add ~30s of presenter intro/narration between steps = **tight 5-minute demo**.

## A/B variants

Have two starting modes:

- **Positive story** — steps 1–5 + 7 (skip Bob). All happy-path. For strategy/opportunity VCs.
- **Fraud story** — all 7 steps. Centers on tamper-resistance. For technical VCs and judges.

Choose based on the audience. Switch by skipping step 6 via `⏭`.

## Backup plan

If anything breaks on stage:
1. Hit `⏭` to skip the broken step
2. Continue narration as if intended
3. Worst case: pre-record a screen capture of a successful run and keep `demo-fallback.mp4` on disk

The page has no spinner, no loading state, no network dependency — it cannot fail due to infrastructure.
