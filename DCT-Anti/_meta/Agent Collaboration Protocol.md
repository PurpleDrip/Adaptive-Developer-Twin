---
tags: [meta, reference]
status: living-document
---

# Agent Collaboration Protocol

> Rules for any AI agent (Claude, GPT, Cursor, etc.) operating on this vault or codebase. **Read this before doing anything.**

---

## 1. Treat this vault as canonical

If the code disagrees with the vault, **flag the discrepancy** — don't silently overwrite either side. Open a note in `13 - Yet to Implement/` describing the drift.

## 2. Read order on a cold start

1. [[00 - Home]]
2. [[_meta/Glossary]]
3. The `_MOC` of the section you'll touch
4. [[12 - Expert Review/Top Risks (Ranked)]] — so you don't worsen a known risk
5. [[13 - Yet to Implement/_MOC]] — so you don't duplicate work

## 3. Atomic edits

- One concept per note (see [[Linking Conventions]])
- If a note grows past ~400 lines, split it
- Never rewrite a note when an `Edit` will do
- Never duplicate a fact — link to the source-of-truth note instead

## 4. Frontmatter is mandatory

Every note you create gets YAML frontmatter:

```yaml
---
tags: [<from Tag Dictionary>]
status: <draft|living-document|frozen>
created: YYYY-MM-DD
---
```

## 5. Diagrams must render

Use Mermaid only — no images of diagrams. Obsidian renders Mermaid live; images go stale.

## 6. Don't edit `frozen` notes

Frontmatter `status: frozen` means: this content is locked. Open a new note + propose a change in [[13 - Yet to Implement/]].

## 7. Update the Changelog

When you make a non-trivial change, prepend a one-line entry to [[Changelog]] with date + summary + your agent name.

## 8. Punch-list discipline

When you mark something complete in [[13 - Yet to Implement/]]:

- Set its `status:` to `done`
- Move it under the `## Done` section of the relevant priority page
- Cross-link the PR/commit that landed it

## 9. Don't touch these zones without explicit approval

- `_meta/Glossary.md` — terminology — discuss first
- `01 - Overview/Vision & Mission.md` — product-level
- `12 - Expert Review/` — that's the principal reviewer's voice

## 10. Honest uncertainty

If you don't know whether a fact is current, write:

```markdown
> ⚠️ **Unverified** — last confirmed YYYY-MM-DD against commit <hash>. Re-verify before relying on this.
```

Don't invent confidence you don't have.

## 11. Source citations

When you make a claim about the code, **cite the file** with backticks:

```
- The Batch Processor uses APScheduler — see `backend/telemetry/app/services/batch_processor.py:42`.
```

## 12. Multi-agent sequencing

If multiple agents are working in parallel:

- Each agent claims an item in [[13 - Yet to Implement/]] by setting `owner: <agent-name>` in its frontmatter
- Release claim when done or stopping
- Never edit another agent's `owner:`d note without an explicit handoff

## 13. Simulation Mode boundary

Any change tagged `#real-mode` must NOT affect Simulation Mode demo paths. Any change tagged `#simulation-mode` must NOT leak into production code paths. See [[11 - Simulation Mode/Safe-Mode Guarantees]].

---

## Quick reference card

```text
┌─────────────────────────────────────────────────┐
│  AGENT QUICK REF                                │
├─────────────────────────────────────────────────┤
│  Cold-start read: Home → Glossary → MOC →       │
│                   Top Risks → Yet-to-Implement  │
│                                                 │
│  Before edit:    backlinks pane                 │
│  Before claim:   set owner: in frontmatter      │
│  After change:   update Changelog               │
│  When unsure:    write ⚠️ Unverified note       │
└─────────────────────────────────────────────────┘
```
