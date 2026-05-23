---
tags: [algorithm]
aliases: [Native Cypher, Pillar 10]
---

# Native Cypher Fallback (Pillar #10)

> Resilient graph queries when Neo4j's GDS (Graph Data Science) plugin isn't available.

## When this matters

- **AuraDB Free tier** doesn't include GDS
- **Self-hosted Community Edition** doesn't include GDS
- **GDS upgrade window** — temporarily unavailable during plugin updates

In any of these, GDS-only queries (PageRank, community detection, Node2Vec) throw `Procedure not found`.

## The pattern

```python
async def influence(session):
    try:
        return await session.run("""
          CALL gds.pageRank.stream({...})
          YIELD nodeId, score
          RETURN gds.util.asNode(nodeId).id AS dev_id, score
          ORDER BY score DESC LIMIT 50
        """).data()
    except neo4j.exceptions.ClientError as e:
        if "gds.pageRank" in str(e):
            log.warning("GDS unavailable, using native fallback")
            return await session.run("""
              MATCH (d:Developer)-[r:HAS_SKILL]->(:Skill)
              WITH d, sum(r.strength * r.confidence) AS density
              RETURN d.id AS dev_id, d.name AS name, density AS influence
              ORDER BY influence DESC LIMIT 50
            """).data()
        raise
```

## Fallback approximations

| GDS algorithm | Native approximation |
|:--------------|:---------------------|
| `gds.pageRank` | `sum(strength * confidence)` per dev (skill density) |
| `gds.louvain` (community) | Group by `primary_domain` |
| `gds.node2vec` | Not approximable in pure Cypher — use centroid via skill vectors |
| `gds.shortestPath` | Native `MATCH path = (a)-[*..5]-(b) RETURN min(length(path))` |

## Why this is a "pillar"

Resilience > performance. We'd rather return a slightly-less-accurate influence ranking than 500 the user. The fallback also makes the system runnable on **any** Neo4j tier — important for self-hosted prospects.

## Observability

> Today: fallback is silent. **Should** emit a counter `thg_gds_fallback_used_total` and an alert if it's ≥1 for >5 minutes (we want to know our prod is missing GDS).

Tracked: [[13 - Yet to Implement/Backend - THG - GDS Fallback Metric]].

## Caveat — semantic difference

`PageRank` ≠ `skill density`. PageRank's network-topology contribution is real and useful. The fallback is **fine** for top-50 ordering, but at the tails the rankings diverge.

If a customer cares about precise influence ordering, **GDS is required**.
