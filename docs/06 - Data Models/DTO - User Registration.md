---
tags: [dto]
aliases: [UserRegistrationDTO]
---

# DTO — User Registration

`shared/models/user.py :: UserRegistrationDTO`

## Wire shape

```json
{
  "name": "string (2..100)",
  "username": "string (3..50, ^[a-zA-Z0-9_]+$)",
  "email": "string (max 255, valid email)",
  "phone_number": "string (10..15)",
  "gender": "Male | Female | Other",
  "password": "string (8..128)",
  "strong_domains": ["backend", "frontend", ...],
  "experience_level": "Intern | Junior | Mid | Senior | Lead | Principal",
  "github_project_urls": ["url1", "url2", ...]
}
```

## Field reference

| Field | Type | Constraints | Notes |
|:------|:-----|:------------|:------|
| `name` | str | 2..100 chars | Display name |
| `username` | str | 3..50 chars, regex `^[a-zA-Z0-9_]+$` | Unique handle, login key |
| `email` | str | max 255, regex validated, lowercased on save | Unique |
| `phone_number` | str | 10..15 chars | Stored as-is |
| `gender` | str | enum: Male / Female / Other | Pattern validator |
| `password` | str | 8..128 chars | Hashed (bcrypt) before storage; never logged |
| `strong_domains` | list[str] | 1..10 items | Self-declared starter skills |
| `experience_level` | enum | Intern / Junior / Mid / Senior / Lead / Principal | Baseline only — THG actuals supersede |
| `github_project_urls` | list[str]? | optional, ≤5 | Queued for project analysis |

## Server-side adds (not in wire DTO)

After validation, these are populated by the router:

- `user_id` = `uuid4().hex`
- `extension_id` = `uuid4().hex`
- `password_hash` = `bcrypt(password, cost=N)`
- `role` = `"developer"`
- `registered_at` = `now()`
- `is_active` = `True`
- `project_analysis_status` = `"pending"` (planned)

The `password` field is **dropped** before persistence.

## Validators

```python
@validator("username")
def username_format(cls, v):
    if not re.match(r"^[a-zA-Z0-9_]+$", v):
        raise ValueError("Username may only contain letters, numbers, underscores")
    return v

@validator("email")
def email_format(cls, v):
    if not re.match(EMAIL_RE, v):
        raise ValueError("Invalid email")
    return v.lower()

@validator("gender")
def gender_enum(cls, v):
    if v not in {"Male", "Female", "Other"}:
        raise ValueError(...)
    return v

@validator("github_project_urls", each_item=True)
def github_url_format(cls, v):
    if not v.startswith(("https://github.com/", "git@github.com:")):
        raise ValueError("Must be a GitHub URL")
    return v
```

## Validation pre-check

Field uniqueness can be checked before final submit via:

```
GET /api/v1/auth/users/validate?field=username&value=alice
GET /api/v1/auth/users/validate?field=email&value=alice@example.com
```

Returns `{ "available": true | false }`.

## Related

- [[02 - System Architecture/Data Flow - Registration]]
- [[03 - Microservices/Auth Service]]
- [[08 - Security & Compliance/PII Handling]]
