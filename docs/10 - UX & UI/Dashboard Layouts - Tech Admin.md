---
tags: [ux, observability]
---

# Dashboard Layouts — Tech Admin

## Goal

**Infrastructure mastery.** Cockpit-density. Maximize the data per square inch.

## Layout (1920 px)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ADT Ops · techadmin                                  prod  staging  sim       │
├──────────────────────────────────────────────────────────────────────────────┤
│ ┌─ System health ──────────────┐ ┌─ Live audit · ▶ streaming ─────────────┐ │
│ │ ● Gateway   12ms             │ │ 12:04:17  skill_update  alice +.04      │ │
│ │ ● Auth      28ms             │ │ 12:04:16  task_assigned carol→bob 1023  │ │
│ │ ● Telemetry 43ms             │ │ 12:04:15  fraud_flag    eve  batch...   │ │
│ │ ● Fusion    412ms ⚠ p99      │ │ 12:04:14  config_change techadm hb 30→60│ │
│ │ ● THG       89ms             │ │ ...                                     │ │
│ │ ● Alloc     67ms             │ │ Filter: [skill_update ▾]  [Export CSV]  │ │
│ │ ● Analytics 31ms             │ │                                         │ │
│ │ ● Mon       18ms             │ │                                         │ │
│ │ ● Task      52ms             │ │                                         │ │
│ │ Overall: degraded (Fusion)   │ │                                         │ │
│ └──────────────────────────────┘ └─────────────────────────────────────────┘ │
│                                                                              │
│ ┌─ System config ──────────────┐ ┌─ Batch processing (last 10) ────────────┐│
│ │ heartbeat_interval_s    [30] │ │ BATCH-202605241200-abc...  done  18s   ││
│ │ batch_interval_m         [5] │ │ BATCH-202605241155-abc...  done  21s   ││
│ │ working_hours [9:00-17:00]   │ │ BATCH-202605241155-def...  done  19s   ││
│ │ fraud_threshold       [0.5]  │ │ ...                                    ││
│ │ [Save · audit-logged]        │ │ Lag: 87s (target <600)                 ││
│ └──────────────────────────────┘ └────────────────────────────────────────┘│
│                                                                              │
│ Quick links:  [Data Explorer]  [Users]  [Devices]  [Snapshots]              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Panel: System Health

- Updates every 10 s
- Per-service latency badge (p50 / p99 toggle)
- Color: green ok, amber latency-elevated, red 5xx
- Click → service-specific detail page

## Panel: Live Audit HUD

See [[02 - System Architecture/Sequence - Live Audit HUD]].

- WebSocket-driven; backfill on reconnect
- Pause / resume
- Filter by action / user / source
- CSV export
- One row = one audit entry (max 500 in memory, oldest evicted)
- Color cue per action

## Panel: System Config

- Each field with current value + bounds
- Save requires confirmation showing **diff** (before → after)
- Save writes audit entry (`action: system_config_changed`)
- Some fields have impact warnings:
  - Changing `heartbeat_interval_s` from 30 to 5 → "This will multiply your ingest cost by 6x. Confirm?"

## Panel: Batch processing

- Last 10 batches as a table
- Status + duration
- Failed batches highlighted; click → error detail

## Quick links

- [[Routes - Tech Admin#/tech/data-explorer|Data Explorer]] — Mongo browser
- Users — directory + lock management
- Devices — device-level lock view ([[13 - Yet to Implement/Backend - Auth - Device Management]])
- Snapshots — workspace zip catalog

## Mode-switcher

Top-right pill: `prod / staging / sim`. The active environment colors the entire chrome:

- `prod` → neutral (no special accent)
- `staging` → orange top border
- `sim` → indigo/pink Sim Mode gradient ([[Color System#Sim Mode accent]])

This **never** lets a tech admin confuse the modes by accident.

See [[11 - Simulation Mode/Mode Switcher Design]].
