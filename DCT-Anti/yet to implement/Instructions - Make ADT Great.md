---
tags: [agent-instructions, roadmap]
---

# Agent Instructions: Make ADT Great

Welcome, Developer Agent! Your mission is to harden the ADT-v1 platform from a working prototype (Level-0) to an enterprise-grade, Tier-1 production intelligence system (Level-100). 

Below is your comprehensive handbook containing exact file paths, loopholes, and implementation blueprints.

---

## 🛠️ The Core Mission

ADT is conceptually robust but suffers from critical architectural and security loopholes:
1. **Telemetry Spoofing**: Telemetry does not verify timestamps, nonces, or secure hardware anchors. Any developer can mock payloads.
2. **Missing Rate Limiting**: The Edge Gateway does not throttle logins, registrations, or telemetry ingestion, exposing the system to denial of service.
3. **Weak AST & Skill Scans**: SCM-Audit only runs once on initial onboarding zip snapshots. Steady-state updates are derived from simple WPM and file modification streams.
4. **Permissive Gateway**: CORS is set to allow `*` on all backend services rather than being restricted to whitelisted frontend domains.

Refer to [[Critical Loopholes]] for a detailed breakdown of each bug and [[Implementation Roadmap]] for your step-by-step checklist.

---

## 🧭 Rules of Engagement

1. **Maintain Polymorphic Isolation**: Never write queries that join user collections. Managers, Developers, and Admins must remain strictly isolated.
2. **Use Compound Indexing**: When editing MongoDB, always verify that your query fields are backed by compound indexes in `shared/database/mongo.py`.
3. **Preserve the Fallback**: When modifying the THG service, ensure that any changes to GDS algorithms maintain the `Native Cypher Fallback` logic in case plugins crash.
4. **Check Your Work**: Every task you complete must be verified using the tests outlined in the checklists.
