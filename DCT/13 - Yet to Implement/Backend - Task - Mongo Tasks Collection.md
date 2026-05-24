---
tags: [yet-to-implement, p1]
status: pending
priority: P1
estimate: 2 days
---

# Backend — Task — Mongo Tasks Collection

## Why
`tasks` collection is defined in [[06 - Data Models/MongoDB Schema#tasks]] but the code only writes graph nodes. Manager dashboards need rich task metadata (description, status timeline, comments).

## Acceptance criteria
- [ ] `task_create` writes to Mongo `tasks` AND THG `Task` node
- [ ] `task_assign` updates both
- [ ] `task_review` adds notes to Mongo (graph stays minimal)
- [ ] `GET /api/v1/task/all` returns Mongo data
- [ ] `GET /api/v1/task/{task_id}` joins both stores

## Files involved
- `backend/task/app/routers/tasks.py`
- `backend/task/app/services/task_service.py` (new)

## Tracked from
[[03 - Microservices/Task Service#Known gaps]]
