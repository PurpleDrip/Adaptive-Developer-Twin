---
tags: [ux]
---

# Microcopy Guidelines

> The text on the screen *is* the product. Treat it like code.

## Voice

- **Direct, not breezy.** "Save changes" not "Save the changes you've made!"
- **Specific, not vague.** "Reset hardware lock for alice@org" not "Are you sure?"
- **Plural is fine.** "5 candidates ranked" not "Candidate(s)".
- **Use the user's noun.** Don't write "Telemetry events"; write "Pings".

## Examples

| Bad | Good |
|:----|:-----|
| "Login failed. Please try again." | "Username or password didn't match." |
| "Are you sure?" | "Permanently delete this draft? You can't undo this." |
| "Loading..." | "Loading skills…" |
| "Error: 500" | "Couldn't reach the skills service. Retrying in 5s." |
| "0 results found" | "No batches yet — telemetry starts after first install." |
| "User has been successfully assigned to task" | "Assigned alice to task-1023." |
| "An error has occurred. Please contact support." | "Save failed (network). Your changes are kept locally — try again." |

## Errors

Pattern: **what happened + what's the user's option**.

```
Hardware lock failed: this extension is already locked to another machine.
[Ask your tech admin to reset] [Try a different extension_id]
```

## Empty states

Pattern: **why this is empty + what to do about it**.

```
No telemetry yet.
Install the ADT extension to start collecting data.
[Get the extension]
```

## Confirmations

Use a verb in the title; describe the consequence in the body.

```
Title: Reassign task to a different developer?
Body:  alice will lose the assignment. The audit log will record the change.
       [Cancel] [Reassign]
```

## Numbers in text

- "1 task" not "1 tasks"; use `pluralize(n, "task")`
- Time ago: "32s ago", "5m ago", "2h ago", "yesterday", "May 21"
- Big numbers: `1,234` (locale-aware), `1.2k`, `1.2M`

## Forbidden words

- **"Easy"** — usually it isn't
- **"Just"** — minimizing
- **"Simply"** — same
- **"Awesome", "great", "amazing"** — marketing speak
- **"Please"** in error messages (overused; one polite use per dialog max)

## i18n posture

V1 is en-US only. Code paths assume ASCII. Plan for i18n:

- All copy in `src/i18n/en-US.json`
- Use `t("registration.title")` from day one
- Never concatenate sentences from fragments — write full strings per locale

Tracked: [[13 - Yet to Implement/Frontend - i18n Stub]].
