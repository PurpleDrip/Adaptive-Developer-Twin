---
tags: [yet-to-implement, meta]
---

# README — For Agents

> If you are an AI agent or human picking up work on ADT, **read this first**.

## How to pick work

1. Open [[P0 - Critical Blockers]]. Take an unclaimed item.
2. If P0 is empty, take from [[P1 - Production Readiness]].
3. If P1 is empty, take from [[P2 - Hardening & Polish]].

## Claiming a task

Edit the task's frontmatter:

```yaml
---
status: in_progress
owner: <your-handle>
started: YYYY-MM-DD
---
```

Don't skip this. Two agents working the same task is wasted work.

## Completing a task

1. Verify against the **Acceptance criteria** in the task note
2. Set `status: done`, add `completed: YYYY-MM-DD`, cross-link the PR
3. Move the note to under the relevant priority page's `## Done` section
4. Prepend a line to [[_meta/Changelog]]

## Task note shape

Every task in this folder follows this skeleton:

```markdown
---
tags: [yet-to-implement, p0|p1|p2, <area>]
status: pending|in_progress|done
owner:
priority: P0|P1|P2
estimate: <hours or days>
---

# <Title>

## Why
1–3 sentences.

## Acceptance criteria
- [ ] thing 1
- [ ] thing 2

## Files involved
- `path/to/file`
- `path/to/another`

## Notes
Anything else relevant.

## Tracked from
- [[12 - Expert Review/...]] (where this was identified)
```

## Sequencing

Some tasks depend on others. The task note's "Notes" section calls out blockers when relevant. Don't start a task if its blocker is pending.

## Communication

When in doubt:

1. Check [[_meta/Agent Collaboration Protocol]]
2. Check [[Linking Conventions]]
3. If still in doubt, write a `⚠️ Unverified` note inline in the task, don't guess

## Quality gates

Before claiming a task `done`:

- [ ] All acceptance criteria checked
- [ ] Tests added (or test plan written if blocked by [[Backend - All - Tests]])
- [ ] Lint clean
- [ ] No new TODOs left without GitHub issues
- [ ] If user-facing: a11y pass (keyboard-only walkthrough)
- [ ] If schema-changing: backwards-compatible OR migration documented

## What if a task is wrong?

Edit the task. Add a `## Revision history` section explaining why you changed scope. Don't delete history.

## What if I discover a new gap?

Add a new note in the right area. Tag it correctly. Link from the area's section in [[_MOC]].
