

```
{
    name,
    username,
    email,
    phone_number,
    gender,
    password,
    strong_domains,
    experience_level,
    github_project_urls
}
```

**`name`** — Full name of the developer. 2–100 chars.

**`username`** — Unique login handle. 3–50 chars. Only alphanumerics and underscores allowed — enforced by regex `^[a-zA-Z0-9_]+$`.

**`email`** — Developer's email. Validated by regex and auto-lowercased on save. Max 255 chars.

**`phone_number`** — Contact number. 10–15 chars.

**`gender`** — One of `Male`, `Female`, `Other`. Enforced by pattern validator.

**`password`** — Raw password sent from the frontend. 8–128 chars. **Note:** Already hashed by the router before it reaches the DB — never stored in plaintext.

**`strong_domains`** — List of skill domains the developer self-declares as strong (e.g. `["backend", "devops"]`). 1–10 items. Used as initial signal before the THG builds real evidence.

**`experience_level`** — Career stage. Must be one of: `Intern`, `Junior`, `Mid`, `Senior`, `Lead`, `Principal`.

**`github_project_urls`** — Optional list of up to 5 GitHub repo URLs. Queued for project analysis to build the initial THG baseline on registration.