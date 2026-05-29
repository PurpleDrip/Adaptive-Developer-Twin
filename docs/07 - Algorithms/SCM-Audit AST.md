---
tags: [algorithm]
aliases: [SCM-Audit, Pillar 2]
---

# SCM-Audit AST (Pillar #2)

> "Source Code Management Audit" — AST-driven structural signals to complement [[CodeBERT Pipeline]]'s semantic signals.

## What it does

Walks the workspace at audit time (initial sign-up or deep-audit) and extracts structural facts:

- **File-extension distribution** — `*.py`, `*.tsx`, `*.tf`, etc.
- **Framework footprints** — `requirements.txt`, `package.json`, `pyproject.toml`, `Dockerfile`, `helm/`, `terraform/`
- **Code-shape patterns** — class density, decorator usage, async/await frequency
- **Test ratio** — files matching test patterns / total files
- **Import graph** — what does this code import from? `flask`, `react`, `pytorch`?

These map deterministically to skill signals through a **taxonomy table**:

| Signal | Inferred skill |
|:-------|:---------------|
| `*.py` + `Dockerfile` + `helm/` | `backend`, `devops` |
| `*.tsx` + `package.json` + `tailwind.config` | `frontend` |
| `*.py` + `torch`, `transformers` | `ml`, `backend` |
| `*.cypher` + Neo4j driver imports | `neo4j`, `database` |
| `test_*.py`, `*.test.tsx` | `testing` |
| `bandit`, `safety`, OAuth flow | `security` |

## Why both AST AND CodeBERT?

| Method | Catches | Misses |
|:-------|:--------|:-------|
| **AST / structural** | Idiomatic-but-not-novel code; large frameworks | Bespoke code; non-idiomatic styles |
| **CodeBERT semantic** | What the code *does* (intent) | Structural breadth (e.g., a single `helm/` folder is a strong devops signal that semantic alone wouldn't weight enough) |

They **complement**, not substitute. Fusion takes both signals and blends.

## Pipeline

```mermaid
flowchart TB
    ZIP[workspace.zip] --> UNZIP[adm-zip extract]
    UNZIP --> WALK[walk files · respect .adt/ignore]
    WALK --> EXTBUC[bucket by extension]
    WALK --> FW[detect frameworks via filenames]
    WALK --> AST[parse top-N candidates · Python tree-sitter / TS parser]
    AST --> IMP[extract imports]
    AST --> SHAPE[class/function/async density]
    EXTBUC --> TAX[apply taxonomy table]
    FW --> TAX
    IMP --> TAX
    SHAPE --> TAX
    TAX --> SIG[skill signals: {skill: float}]
```

## Output shape

```json
{
  "user_id": "uuid",
  "files_scanned": 124,
  "languages_detected": ["python", "yaml", "dockerfile", "json"],
  "frameworks_detected": ["fastapi", "neo4j-driver", "pytest"],
  "structural_signals": {
    "backend": 0.70,
    "database": 0.40,
    "neo4j": 0.30,
    "testing": 0.25,
    "devops": 0.20
  }
}
```

This is merged with the CodeBERT semantic output via `max(structural, semantic)` per skill (current impl in `deep_audit`).

## Code location

- `backend/fusion/app/services/project_analyzer.py` — **currently a stub.** Tracked: [[13 - Yet to Implement/Backend - Fusion - Real ML Pipeline]] / [[13 - Yet to Implement/Backend - Fusion - SCM-Audit Implementation]].

## Recommended implementation libraries

- **tree-sitter** for multi-language AST (Python, JS/TS, Go, Rust)
- **`detect-secrets`** for security signal extraction (also a P0 secret scanner!)
- **`pylint`/`bandit`/`mypy`** as auxiliary signal generators (call coverage, complexity)

## What this does NOT do

- **It doesn't grade code quality.** A high test ratio adds testing signal — it doesn't claim the tests are good.
- **It doesn't read commit messages.** Future: integrate git log for chronological skill growth signal.
