---
tags: [privacy, compliance]
---

# Telemetry Consent & Ethics

> The product can only win if developers *want* to be measured by it. This page is the social contract.

## What the developer agrees to (at install time)

Shown as a **plain-language** consent screen, not a legal wall of text:

```
ADT will record, during your working hours:
  ✓ How fast you type (anonymized, in 5-minute windows)
  ✓ Which files you have open (paths, not contents)
  ✓ Short snippets (±10 lines around your cursor)
  ✓ The skills CodeBERT infers from those snippets

ADT will NOT:
  ✗ Read your personal files outside your workspace
  ✗ Capture your screen
  ✗ Record what you write outside VS Code
  ✗ Log keystrokes verbatim (we count, we don't capture)

You can pause telemetry anytime via the status bar.
You can request your data deleted in /dashboard → Settings.
```

The dev clicks "I understand & accept" — this fact is stored with timestamp + version of the consent text.

## What a developer can do at any time

1. **Pause** — `adt.pause` command stops the sender; status bar turns gray; manager sees "paused" in HUD (not "offline")
2. **Inspect** — `/dashboard → My Data` shows the last N records in plain JSON
3. **Export** — Article 15 (planned)
4. **Erase** — Article 17 (planned)
5. **Disconnect** — clears hardware lock; from then on, no telemetry; manager sees "disconnected"

## What managers and tech admins can do

| Manager / HRM | Tech Admin |
|:--------------|:-----------|
| ✓ See aggregated team metrics | ✓ See system-wide config + audit |
| ✓ See an individual dev's audit history (with manager-of relationship verified) | ✓ Read every audit entry |
| ✗ Decrypt code snippets | ✗ Decrypt code snippets without explicit + audited approval |
| ✗ Re-enable telemetry for a dev who paused it | ✓ Reset hardware lock (audited) |
| ✗ Edit a dev's THG skills directly | ✓ Edit any DB via Data Explorer (audited) |

## Ethics review checklist (before launching a new feature)

Before *any* feature that uses telemetry data, run through:

- [ ] Does this show data the dev couldn't see for themselves?
- [ ] Could this be used in a disciplinary context?
- [ ] Could the dev be surprised this exists?
- [ ] Is there a less-invasive way to get the same product value?
- [ ] If a dev sees this feature for the first time, would they be more or less likely to opt in to ADT?

A "no" on any of these triggers a design review before merge.

## What we will not build

- **Per-keystroke timing graphs** shown to managers
- **"Inactive" alerts** to managers based on idle seconds
- **Heatmaps of "when alice was working"** at sub-day resolution
- **Cross-employer skill marketplaces** without explicit opt-in
- **Disciplinary auto-reports** to HR

Reaffirm these in [[01 - Overview/Vision & Mission]].
