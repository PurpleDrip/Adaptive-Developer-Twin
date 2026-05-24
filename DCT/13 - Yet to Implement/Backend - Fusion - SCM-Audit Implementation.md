---
tags: [yet-to-implement, p2]
status: pending
priority: P2
estimate: 1 week
---

# Backend — Fusion — SCM-Audit Implementation

## Why
Sub-task of [[Backend - Fusion - Real ML Pipeline]]. Implements the AST + framework detection per [[07 - Algorithms/SCM-Audit AST]].

## Acceptance criteria
- [ ] tree-sitter integration for Python, TS/JS, Go, Rust
- [ ] Framework detection from filenames + import statements
- [ ] Taxonomy table → structural skill signals
- [ ] Output merged with CodeBERT semantic by `max()` per skill
- [ ] Unit tests against sample workspaces

## Files involved
- `backend/fusion/app/services/project_analyzer.py`
- `backend/fusion/app/services/ast_walker.py` (new)
- `backend/fusion/app/services/taxonomy.py` (new)

## Tracked from
[[07 - Algorithms/SCM-Audit AST]]
