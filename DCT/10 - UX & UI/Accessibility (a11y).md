---
tags: [ux, a11y]
---

# Accessibility (a11y)

## Target

**WCAG 2.2 AA** across the product. AAA for body text contrast.

## Audit cadence

- Per-PR: `@axe-core/react` smoke pass in CI
- Quarterly: full audit by external review
- Per-feature: keyboard walkthrough before merge

Tracked: [[13 - Yet to Implement/Frontend - Accessibility CI]].

## Non-negotiables

| Requirement | How |
|:------------|:----|
| Keyboard-only navigation across every flow | Tab order matches visual order; focus rings always visible |
| Screen reader labels on icon-only buttons | `aria-label` |
| Form errors announced to AT | `aria-live="polite"` on error region |
| Color is not the only signal | Status icon + text, never icon-only |
| Charts have a text alternative | Recharts → table view toggle |
| Motion respect | `prefers-reduced-motion` disables non-essential transitions |
| Color contrast | min AA (4.5:1 text, 3:1 large/icon); body AAA |
| Click targets | min 44×44 px on touch |

## Specific patterns

### Skill radar

The radar is a chart-first surface. Provide a "Table view" toggle that lists the same data in a `dl` with descriptions. Screen readers prefer the table.

### Live Audit HUD

- Stream announces only **on user opt-in** (toast "Announce new audit events?")
- Even with opt-in, throttle announcements to one per 5 s, summarized ("3 new skill updates")

### Form validation

Inline error messages, both:

- `aria-describedby` pointing to a hidden `<span>` with the error text
- `aria-invalid="true"` on the input

### Modals

- Trap focus
- Restore focus on close
- ESC closes
- Click-outside closes (with confirm if dirty)

### Color-coded badges

Status indicators always include text:

```
✓ Healthy    ⚠ Degraded    ⛔ Down
```

Never `🟢🟡🔴` alone.
