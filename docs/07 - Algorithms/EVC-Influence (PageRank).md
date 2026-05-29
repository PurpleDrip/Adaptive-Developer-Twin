---
tags: [algorithm]
aliases: [EVC, PageRank, Pillar 6]
---

# EVC-Influence (Pillar #6)

> "Eigenvector-Centrality Influence" — find the **knowledge hubs**: devs whose strong skills connect them to many others.

## What it actually computes

A weighted PageRank over the bipartite Dev↔Skill subgraph where:

- Nodes: `Developer`, `Skill`
- Edges: `HAS_SKILL` weighted by `strength * confidence`

A dev with many high-strength edges to skills that *other* devs also strongly hold ends up with a high influence score — they're a "hub."

## Why this is useful

- **Mentoring matches**: high-influence in `backend` + low-influence dev needs a `backend` mentor → suggested pair
- **Bus-factor analysis**: if one dev's influence on `neo4j` is much higher than the org's #2, you have a risk
- **Hiring fit**: when evaluating a candidate against an org, their skill profile's projected influence is a signal

## Algorithm

```cypher
CALL gds.pageRank.stream({
  nodeProjection: ['Developer', 'Skill'],
  relationshipProjection: {
    HAS_SKILL: {
      orientation: 'UNDIRECTED',
      properties: 'strength'
    }
  },
  relationshipWeightProperty: 'strength',
  dampingFactor: 0.85,
  maxIterations: 20
})
YIELD nodeId, score
WHERE gds.util.asNode(nodeId):Developer
RETURN gds.util.asNode(nodeId).id AS dev_id,
       gds.util.asNode(nodeId).name AS name,
       score AS influence
ORDER BY score DESC
LIMIT 50
```

## The fallback

When the Neo4j GDS plugin isn't available (e.g. open-source AuraDB Free, or a self-hosted Community Edition), we substitute a hand-written **skill density** approximation:

```cypher
MATCH (d:Developer)-[r:HAS_SKILL]->(:Skill)
WITH d, sum(r.strength * r.confidence) AS density
RETURN d.id, d.name, density AS influence
ORDER BY influence DESC LIMIT 50
```

This is **not** PageRank — it's `sum(strength * confidence)`, which approximates "how loaded with skill is this dev." Doesn't capture network topology, but ranks similarly in the common case.

See [[Native Cypher Fallback]] for the full fallback pattern.

## Caveat — bipartite distortion

A standard PageRank over a bipartite graph gives **skills** high scores too. We filter to only `:Developer` nodes in the YIELD. If we ever need skill-level influence ("which skill is the org's most central?"), that's a different ranking.

## Performance

- GDS PageRank on 10 k devs + 8 skills: ~200 ms one-shot
- Native fallback: ~80 ms
- Cache the result with `TTL=5 min` — influence doesn't move fast.

Tracked: [[13 - Yet to Implement/Backend - THG - Influence Cache]].

## Code location

- `backend/thg/app/routers/thg.py :: get_influence_ranking`
- Both code paths present; GDS-not-available is silently fallback. No metric for "are we using fallback?" — should add. ([[13 - Yet to Implement/Backend - THG - GDS Fallback Metric]])
