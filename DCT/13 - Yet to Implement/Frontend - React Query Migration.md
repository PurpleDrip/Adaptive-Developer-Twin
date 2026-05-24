---
tags: [yet-to-implement, p2, frontend]
status: pending
priority: P2
estimate: 1 week
---

# Frontend — React Query Migration

## Why
Page-level `useEffect(fetch)` proliferates. React Query gives caching, retries, stale-while-revalidate for free.

## Acceptance criteria
- [ ] `@tanstack/react-query` installed
- [ ] `QueryClient` mounted at root layout
- [ ] Every fetch migrated to `useQuery`/`useMutation` hooks under `src/lib/queries/`
- [ ] `staleTime: 30s` default for THG reads
- [ ] Tests: a stale read serves cached data immediately while refetching

## Files involved
- `frontend-nextjs/src/lib/queries/*.ts` (new)
- Component refactors

## Tracked from
[[05 - Frontends/Routes - Project Manager#State]]
