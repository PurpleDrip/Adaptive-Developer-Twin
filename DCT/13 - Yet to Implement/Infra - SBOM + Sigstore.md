---
tags: [yet-to-implement, p2, security]
status: pending
priority: P2
estimate: 2 days
---

# Infra — SBOM + Sigstore

## Why
Supply-chain attacks are real. Customers want SBOMs.

## Acceptance criteria
- [ ] CI generates SBOM (CycloneDX) per service image
- [ ] Images signed with Sigstore (cosign)
- [ ] Verification step in deploy
- [ ] SBOMs published at `https://docs.adt.example.com/sbom/<version>`

## Files involved
- CI config
- `.github/workflows/*.yml`

## Tracked from
[[08 - Security & Compliance/OWASP Coverage#A08]]
