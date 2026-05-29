---
tags: [meta, reference]
---

# Linking Conventions

> Treat the vault like code. Atomic notes, link generously, never duplicate facts.

## 1. Atomic notes

One concept per note. If a note grows past ~400 lines or covers two unrelated ideas, split it. Replace the old content with `[[link]]`s.

## 2. Folder-relative `_MOC`

Every folder has a `_MOC.md` that links to all notes in the folder. Link **to the MOC**, not the folder, when referencing a topic area.

Bad: `see the Microservices folder`
Good: `see [[03 - Microservices/_MOC|Microservices]]`

## 3. Alias for readability

Use `[[Full Path|short name]]` when the path is long:

```
[[03 - Microservices/Telemetry Service|Telemetry]]
```

## 4. Link anchors for section depth

When pointing at a section, use `#`:

```
[[06 - Data Models/MongoDB Schema#telemetry_raw|telemetry_raw collection]]
```

## 5. Forward-link freely

If you mention a concept that doesn't have a note yet, **still link it**. A red link is a TODO marker.

## 6. Backlinks are first-class

Before editing a note, check Obsidian's backlinks pane. A change here might break readers downstream.

## 7. Code & paths

- File paths from repo root: ``backend/auth/app/routers/users.py``
- Endpoints: ``POST /api/v1/auth/users/register``
- Env vars: `FUSION_URL`
- Wrap in backticks always.

## 8. Diagrams

Use Mermaid (Obsidian renders natively). Prefer `sequenceDiagram`, `flowchart LR`, `classDiagram`, `erDiagram`.

## 9. Frontmatter

Every note has YAML frontmatter:

```yaml
---
tags: [<from Tag Dictionary>]
aliases: [<optional>]
status: <draft | living-document | frozen>
---
```

## 10. Never duplicate

If two notes both define a term, **delete one and link**. Use [[Glossary]] for terminology, never inline.
