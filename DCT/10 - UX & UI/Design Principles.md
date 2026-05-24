---
tags: [ux]
---

# Design Principles

> What every screen, every animation, every word must serve.

## 1. Evidence, not vibes

Every number on the screen has a **why**. Hover → `SHAP` rationale. Click → see the audit entries that produced it. The Twin is never a black box.

## 2. Show the developer themselves first

A developer's `/dashboard` shows *their own* data with full fidelity. Cross-developer views are minimized and never come before self-view in any navigation.

## 3. Calm > flashy

This product **judges people**. The UI must feel measured, not gamified. No celebratory confetti on a skill bump. A subtle change in a number, a smooth radar morph, a quiet `+0.03` annotation. No "🎉 you're a 10x ninja!" anywhere.

## 4. Investor mode is loud — by intent

The exception: [[11 - Simulation Mode/_MOC|Simulation Mode]] for investor demos. There, theatricality is the point. Keep the two modes visually distinct so devs never confuse them.

## 5. Information density is a feature

Engineers can read dense screens. Don't bury data behind 5 clicks. The Tech Admin HUD should look like a cockpit, not a marketing page.

## 6. Speed matters

- First meaningful paint < 800 ms
- Time-to-interactive < 1.5 s
- Skill radar streams in (Suspense) — never blank-then-pop

## 7. Honest empty states

If we don't have data for a chart, say so explicitly:

> "No batches processed yet for this developer. Telemetry begins after first install."

Never a fake spinner that stops, never zeros that look real.

## 8. Privacy is the design

UI choices that subtly shape behavior:

- Default: anonymized initials in leaderboards
- Default: only the dev sees their own VDA score
- Manager views *aggregate* before *individual*
- Tech Admin sees IDs, not names, unless they explicitly toggle (audited)

## 9. Mistakes are reversible (when possible)

- Issue a task to wrong dev → undo within 60 s
- Edit `system_config` → 5-second confirm with a diff preview
- Delete a user → soft-delete first, hard-delete after a cooling period

## 10. The dashboard is for the worst day

Design every screen for the moment a manager is overwhelmed, an admin is in an outage, a dev is about to be reviewed. **Reduce cognitive load, not add to it.**
