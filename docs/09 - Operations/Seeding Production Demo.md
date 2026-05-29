---
tags: [observability]
---

# Seeding Production Demo

> The "Nuclear Reset" — wipe and re-seed everything to a known-good demo state. Used for investor demos, dev resets, e2e tests.

## What it touches

| Store | Script | Behavior |
|:------|:-------|:---------|
| Mongo | `scripts/seed_production_demo.py` | Drops + re-creates `users`, `managers`, `tech_staff`, `whitelist`, `telemetry_raw`, `telemetry_batches`, `tasks`, `audit_logs`, `system_config` |
| Neo4j | `scripts/seed_thg.cypher` | `MATCH (n) DETACH DELETE n` then re-creates 50 devs, 5 managers, ~200 HAS_SKILL edges |
| Redis | (none — ephemeral) | (resets naturally) |

## Run it

```bash
# 1. Mongo
python scripts/seed_production_demo.py

# 2. Neo4j (run in cypher-shell or Browser)
cypher-shell -u $NEO4J_USER -p $NEO4J_PASSWORD < scripts/seed_thg.cypher

# 3. Optional: synthetic telemetry
python scripts/data_synthesizer.py --count 1000

# 4. Optional: full lifecycle simulation
python scripts/simulate_lifecycle.py --devs 50 --days 14
```

## Demo personas seeded

5 managers, 50 developers across squads:

| Squad | Manager | Devs |
|:------|:--------|:----:|
| AI | aimgr | 10 |
| Backend | bemgr | 10 |
| Frontend | femgr | 10 |
| Mobile | momgr | 10 |
| DevOps | dvmgr | 10 |

Plus tech_staff:

- `techadmin` (role: `tech_admin`)
- `techsupport` (role: `tech_support`)

All passwords: `demo123` (bcrypted in DB).

## Safety rails

> **The seeder calls `db.X.drop()` on every collection.** Running this against prod will lose data.

The script checks `MONGO_DB_NAME` and refuses to run if it contains `prod` (case-insensitive). Add `--force` to override.

Tracked: [[13 - Yet to Implement/Scripts - Seeder Hard Stops]].

## What to demo with this

- Login as `bemgr` → see backend squad → create task → see candidates ranked
- Login as `alice@dev` → see Radar HUD → submit assessment
- Login as `techadmin` → System Health green → Audit HUD live

See [[11 - Simulation Mode/Demo Data Recipes]] for the scripted demo flows.

## What this does NOT seed

- Workspace snapshots in object storage (needs separate uploader)
- Real OAuth tokens or GitHub data
- Real Neo4j GDS plugin (graceful fallback handles it)
