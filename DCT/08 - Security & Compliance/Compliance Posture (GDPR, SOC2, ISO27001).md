---
tags: [compliance]
---

# Compliance Posture

> Status: **not yet certified.** Architecture is designed to make certification achievable. This page is the gap list per framework.

## GDPR

| Article | Requirement | Status |
|:--------|:------------|:-------|
| Art. 5 | Lawfulness, fairness, transparency | Partial — consent screen needed ([[Telemetry Consent & Ethics]]) |
| Art. 6 | Lawful basis | "Legitimate interest" + employer-mandate; document per customer DPA |
| Art. 13 | Information at collection | Consent screen P0 |
| Art. 15 | Right of access | **Not implemented** — [[13 - Yet to Implement/Compliance - GDPR Data Export]] |
| Art. 17 | Right to erasure | **Not implemented** — [[13 - Yet to Implement/Compliance - GDPR Right to Erase]] |
| Art. 20 | Data portability | Same JSON bundle as Art. 15 |
| Art. 25 | Privacy by design | Partial — see [[PII Handling]] |
| Art. 30 | Records of processing | Not formally documented |
| Art. 32 | Security of processing | Partial — see [[Encryption at Rest & Transit]] |
| Art. 33 | Breach notification (72h) | No runbook yet |
| Art. 35 | DPIA for high-risk processing | Required for skill scoring — not done |

## SOC 2 (Type II)

Trust Service Criteria status:

| TSC | Status |
|:----|:-------|
| **Security** | Foundation only; gaps in [[Secrets Management]], [[Auth & Sessions]], [[Rate Limiting & Abuse]] |
| **Availability** | No published SLOs; no DR exercises; [[09 - Operations/Backup & DR\|DR plan]] needs drafting |
| **Processing Integrity** | Audit log immutability planned; hash chain not yet ([[Audit Logging#Tamper detection]]) |
| **Confidentiality** | PII handling solid in design, gaps in code |
| **Privacy** | GDPR alignment in progress |

SOC 2 prep: minimum 6 months of evidence under controls. Plan to start the clock once Tier-1 gaps close.

## ISO 27001

Annex A controls status (rough):

- **A.5 Information security policies** — needed (write policy docs)
- **A.6 Organization** — needed (roles + responsibilities matrix)
- **A.8 Asset management** — partial (this vault is part of it)
- **A.9 Access control** — see [[RBAC Matrix]]
- **A.10 Cryptography** — see [[Encryption at Rest & Transit]]
- **A.12 Operations security** — partial; see [[09 - Operations/_MOC]]
- **A.13 Communications security** — needs TLS enforcement
- **A.14 System acquisition, development, maintenance** — needs SDLC docs
- **A.16 Incident management** — see [[09 - Operations/Runbook - Incident Response]]
- **A.17 Business continuity** — needs BCP / DR plan
- **A.18 Compliance** — this page

## HIPAA / FedRAMP

Out of scope for V1. Architecture supports adding tenant-isolated deployments later.

## DPIA (Data Protection Impact Assessment)

Required because we process special-category data (employer-employee monitoring). Outline:

1. **Purpose** — task allocation + skill audit
2. **Necessity** — claim grounded; alternatives weighed
3. **Risks** — over-surveillance, score-manipulation incentives, mental-health impact of measurement
4. **Mitigations** — see [[Telemetry Consent & Ethics]], [[RBAC Matrix]]
5. **Residual risks** — listed in [[12 - Expert Review/Top Risks (Ranked)]]

Tracked: [[13 - Yet to Implement/Compliance - DPIA Draft]].
