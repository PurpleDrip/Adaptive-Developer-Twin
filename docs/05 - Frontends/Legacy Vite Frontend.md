---
tags: [frontend]
---

# Legacy Vite Frontend

`frontend/` — the pre-Next.js stack. **Not actively used.** Kept for reference because some early registration UX was prototyped here.

## Status

| | |
|:---|:---|
| Status | Frozen — do not extend |
| Path | `frontend/` |
| Framework | Vite + React (TypeScript) |
| Why it exists | Initial prototype before App Router migration |

## What's worth salvaging

- A couple of `src/components` that were direct copies; if you see one in `frontend-nextjs/src/components`, prefer the Next.js version.

## Sunset plan

- Once a final pass confirms no live route in either app references it, **delete the folder**. Tracked: [[13 - Yet to Implement/Frontend - Remove Legacy Vite App]].
- Update `README.md` and `docker-compose.yml` (if it ever referenced this — it doesn't currently).
