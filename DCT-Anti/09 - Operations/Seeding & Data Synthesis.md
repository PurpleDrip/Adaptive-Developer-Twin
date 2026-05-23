---
tags: [operations, testing]
---

# Seeding & Data Synthesis

To allow testing and demo runs without shipping real developer keys, ADT has a high-density, deterministic synthetic seed generator located at `scripts/seed_production_demo.py` and `scripts/data_synthesizer.py`.

## Nuclear Reset Command

Executing a complete database wipe and population of whitelisted enterprise mock data:

```powershell
# In Windows Powershell from the project root
python scripts/seed_production_demo.py --nuclear-reset
```

## Synthesis Logic

1. **Mongo Clear**: Drops `users`, `managers`, `tech_staff`, `telemetry_raw`, `telemetry_batches`, and `tasks` collections.
2. **Neo4j Clear**: Executes `MATCH (n) DETACH DELETE n` via the THG service.
3. **Silo Creation**: Creates three managers, one HRM, and 20 developers mapped into squads.
4. **THG Generation**: Runs Cypher logic (`scripts/seed_thg.cypher`) to map skills, centrality weights, and organizational hierarchy.
5. **Telemetry History synthesis**: Populates the last 14 days of realistic telemetry streams (WPM, cursor activity, focus durations, branch changes, and commit strings) to generate a realistic initial digital twin profile.
