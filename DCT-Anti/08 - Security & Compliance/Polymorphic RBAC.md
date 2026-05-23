---
tags: [security, architecture]
---

# Polymorphic RBAC

ADT implements physical database isolation for role permissions instead of traditional role-based flags (e.g. `role: "admin"`). This represents our **Identity Isolation** pillar.

## Silo Model (3 Separate Collections)

Rather than storing all identities in a single `users` collection, ADT distributes them into three separate MongoDB collections:

```
                      [ API Gateway (Port 8000) ]
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
           [ users ]          [ managers ]    [ tech_staff ]
          (Developers)        (PMs / HRMs)    (Tech Admins)
```

1. **`users` (Developers)**: Contains standard developer fields, primary domain, and whitelisted extensions. Absolutely zero ability to perform manager actions.
2. **`managers`**: PM, HRM, and Senior Manager accounts. Contains squad mapping information.
3. **`tech_staff`**: Systems engineering and support personnel who manage system configurations.

## Code Architecture (`shared/auth/rbac.py`)

Every endpoint is protected using physical type checking:

```python
# shared/auth/rbac.py (Conceptual implementation)
from fastapi import HTTPException, Security, Depends
from shared.models.user import DeveloperModel, ManagerModel, TechStaffModel

async def get_current_developer(user = Depends(get_current_user)) -> DeveloperModel:
    if not isinstance(user, DeveloperModel):
        raise HTTPException(status_code=403, detail="Access denied. Developer role required.")
    return user

async def get_current_manager(user = Depends(get_current_user)) -> ManagerModel:
    if not isinstance(user, ManagerModel):
        raise HTTPException(status_code=403, detail="Access denied. Manager role required.")
    return user
```

## Why Traditional RBAC Fails (and why this is Tier-1)
In traditional RBAC, a single parameter injection or SQL/NoSQL injection vulnerability can toggle a `role` field from `developer` to `admin`. Under our polymorphic architecture:
- Developer profiles and Manager profiles are separate Pydantic classes and live in **physically separate databases/collections**.
- There is **no query** in the application that can fetch a Developer object and bind it to a Manager class, making role escalation logically impossible without complete database compromise.
