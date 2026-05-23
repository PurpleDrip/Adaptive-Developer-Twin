---
tags: [operations, pipeline]
---

# CI-CD Pipeline

ADT implements a high-integrity CI/CD pipeline built on GitHub Actions, focusing on security audits, strict API contract enforcement, and deterministic container builds.

## Pipeline Blueprint

```mermaid
graph TD
    A[Commit pushed to main] --> B[Lint & Format Check]
    A --> C[Security Scan (Trivy + Secret-Scan)]
    B & C --> D[Unit Tests (pytest / vitest)]
    D --> E[Contract Verification (Pact testing)]
    E --> F[Build Multi-Arch Container Images]
    F --> G[Push to Container Registry with commit SHA]
    G --> H[Continuous Deployment (ArgoCD to Kubernetes)]
```

## Contract Enforcement
To prevent DTO schema mismatch failures in a distributed microservice network, the CI/CD runs **Pact Contract Tests** between the shared models (in `shared/models/` and `shared/dto/`) and each microservice's ingestion routes. 

Any schema breaking change instantly alerts developers and blocks integration.

## Reproducible Builds
Every microservice's `Dockerfile` leverages multi-stage builds. Dependency resolution hashes are pinned in `requirements.txt` and `package-lock.json` respectively. The build pipeline produces the identical container SHA given the same codebase hash.
