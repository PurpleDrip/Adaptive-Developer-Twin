---
tags: [frontend, ux]
---

# Routes — Developer

Routes the developer touches.

## `/register`

Multi-step form, server-validated per field.

Steps:

1. **Identity** — name, username, email
2. **Contact** — phone, gender
3. **Credentials** — password (8–128 chars)
4. **Skills (self-declared)** — `strong_domains` chips, 1–10
5. **Experience** — Intern / Junior / Mid / Senior / Lead / Principal
6. **GitHub URLs (optional)** — up to 5, queued for project analysis
7. **Submit** — POST to `/api/v1/auth/users/register`
8. **Success** — Show `extension_id` (one-time), copy-to-clipboard

Each step's data is `POST`ed to `/api/v1/auth/users/save-session?session_id=...` so refresh doesn't lose progress (24h TTL).

Components: [[Components Index|registration/AnalysisHUD]], `SuccessStep`, `ValidationIcon`.

## `/onboarding/developer`

After landing with role=Developer. Shows:

- "Already have an account? → /login?role=developer"
- "New here? → /register"

## `/login?role=developer`

- POST `/api/v1/auth/users/login` with `{username, password}`
- On 200, store user in client state (today: localStorage — should be httpOnly cookie post-[[13 - Yet to Implement/Backend - Auth - JWT + Sessions|JWT]])
- Redirect to `/dashboard`

## `/dashboard`

The developer's primary view. See [[10 - UX & UI/Dashboard Layouts - Developer]] for the layout spec.

Sections:

- **Radar HUD** — `recharts/Radar` over the 8 skill axes
- **Trend** — last 14 days of confidence change
- **Org rank** — your row in `/thg/leaderboard/{primary_domain}` + position
- **Open tasks** — `GET /api/v1/task/user/{user_id}`
- **Assessments** — list of pending / completed (when assessment surface ships)
- **Audit "What changed today"** — last 5 audit entries scoped to you

Data fetching (today, can improve):

```ts
useEffect(() => {
  Promise.all([
    api.get(`/thg/skills/${userId}`),
    api.get(`/task/user/${userId}`),
    api.get(`/thg/leaderboard/${primaryDomain}`),
  ]).then(setData)
}, [])
```

Should move to RSC + Suspense for streaming.

## Privacy posture (`/dashboard` only)

- **You see your own data.** No one's else's identifying info.
- Org rank shows your *position* (e.g., "7 of 23 in backend") but not absolute names of peers above you.
- The leaderboard view is **opt-in** — defaults to anonymized initials unless the developer toggles a "compete publicly" flag (planned).

See [[10 - UX & UI/Dashboard Layouts - Developer]] and [[08 - Security & Compliance/PII Handling]].
