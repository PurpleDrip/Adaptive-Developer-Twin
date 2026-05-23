---
tags: [roadmap, guidelines]
---

# Yet-To-Implement: Agent Instructions

> Crucial reading for any AI Agent picking up tasks in the ADT project.

## Checklist Enforcement

When implementing any task in the `Yet to Implement` checklists:
1. **Locate the exact task file**: Look inside `P0`, `P1`, `P2`, or `P3` files.
2. **Mark the task status**:
   - `[ ]` for uncompleted tasks
   - `[/]` for in-progress tasks
   - `[x]` for completed tasks
3. **DO NOT delete completed items**: Keep them checked off for full historical verification.
4. **Update `_meta/Changelog.md`**: Log the completion of the task, referencing the task file and the Git commit hash.

## Verification Requirements
Every code implementation must be matched with its specified **Verification** actions. Do not close a task unless automated integration or manual verification scripts execute with a 100% success rate.
