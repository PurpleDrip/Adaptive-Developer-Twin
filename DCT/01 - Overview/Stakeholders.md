---
tags: [overview]
---

# Stakeholders

| Role | DB silo | Primary view | Primary tool |
|:-----|:--------|:-------------|:-------------|
| **Developer** | `users` | `/dashboard` | VS Code extension |
| **Project Manager** | `managers` | `/project-manager` | HRM Command Console |
| **HRM** | `managers` (role=`hrm`) | `/project-manager` (extended) | Cross-squad analytics |
| **Senior Manager** | `managers` (role=`senior_manager`) | `/project-manager` (extended) | Org-wide leaderboards |
| **Tech Admin** | `tech_staff` | `/tech` | Live Audit HUD + System Config |
| **Tech Support** | `tech_staff` (role=`tech_support`) | `/tech` (limited) | Read-only audit log |

## Capability matrix

| Capability | Dev | PM | HRM | Senior Mgr | Tech Admin |
|:-----------|:---:|:--:|:---:|:----------:|:----------:|
| View own Twin | ✓ | ✓ | ✓ | ✓ | ✓ |
| View squad Twin | – | ✓ (own) | ✓ (all) | ✓ (all) | ✓ |
| Create task | – | ✓ | ✓ | ✓ | – |
| Assign task | – | ✓ | ✓ | ✓ | – |
| Issue assessment | – | ✓ | ✓ | ✓ | – |
| Edit system config | – | – | – | – | ✓ |
| Browse Mongo (Data Explorer) | – | – | – | – | ✓ |
| Manage RBAC | – | – | – | – | ✓ |
| Create manager accounts | – | – | – | – | ✓ |

Implemented via [[08 - Security & Compliance/RBAC Matrix]] and [[03 - Microservices/Auth Service]] polymorphic auth.

## Related

- [[10 - UX & UI/Dashboard Layouts - Developer]]
- [[10 - UX & UI/Dashboard Layouts - PM]]
- [[10 - UX & UI/Dashboard Layouts - Tech Admin]]
