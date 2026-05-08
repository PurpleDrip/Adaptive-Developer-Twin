# Adaptive Developer Twin (ADT)

> An AI-powered platform that creates a "Digital Twin" of every developer in an organization, tracking their skills, work patterns, and growth trajectory through a real-time Neo4j topology graph.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Services](#services)
- [Setup Instructions](#setup-instructions)
- [VS Code Extension Setup](#vs-code-extension-setup)
- [Demo Credentials](#demo-credentials)
- [API Documentation](#api-documentation)
- [Algorithms](#algorithms)

---

## Overview

ADT transforms raw developer activity into actionable engineering intelligence. It combines:

- **CodeBERT-powered repository analysis** to understand code intent
- **Real-time telemetry fusion** from a VS Code extension
- **Neo4j graph analytics** (PageRank, Cosine Similarity) for skill ranking
- **Multi-tenant role isolation** for Developers, Managers, and Tech Admins

---

## Architecture

```
Frontend (Next.js)  -->  API Gateway (:8000)  -->  Microservices
                                                    ├── Auth Service (:8001)
                                                    ├── Telemetry Service (:8002)
                                                    ├── Task Service (:8003)
                                                    ├── Analytics Service (:8004)
                                                    ├── Fusion Service (:8005)
                                                    ├── Monitoring Service (:8007)
                                                    ├── THG Service (:8008)
                                                    └── Allocation Engine (:8009)
```

**Databases:**
- MongoDB Atlas — User data, tasks, telemetry batches
- Neo4j AuraDB — Topology graph (skills, relationships, influence)
- Redis (Upstash) — Session caching

---

## Tech Stack

| Layer | Technology |
|:---|:---|
| Frontend | Next.js 14, React, Recharts, Lucide Icons |
| Backend | Python, FastAPI, Uvicorn |
| Graph DB | Neo4j AuraDB |
| Document DB | MongoDB Atlas |
| Cache | Redis (Upstash) |
| Extension | VS Code Extension API, TypeScript |
| Auth | bcrypt, SHA-256 Hardware Anchoring |

---

## Services

| Service | Port | Core Functions |
|:---|:---|:---|
| **Gateway** | 8000 | Routes all API traffic to the correct microservice. Handles CORS, timeouts, and error responses. |
| **Auth** | 8001 | Polymorphic login across 3 isolated collections, user registration, hardware lock management, session storage. |
| **Telemetry** | 8002 | Ingests raw keystroke/CLI data from the VS Code extension. Runs the SWEF batch processor every 30 minutes. |
| **Task** | 8003 | Task creation, AI-powered candidate matching, task assignment, weekly assessment engine with anti-cheat. |
| **Analytics** | 8004 | Developer summaries, composite leaderboard (skill + influence), burnout prediction, success probability. |
| **Fusion** | 8005 | CodeBERT-powered repository analysis. Scans GitHub projects and extracts semantic skill vectors. |
| **Monitoring** | 8007 | System health monitoring, audit log aggregation. |
| **THG** | 8008 | Neo4j graph operations — skill updates, influence ranking (PageRank), task matching, developer topology. |
| **Allocation** | 8009 | Cosine Similarity matching engine. Ranks developers against task requirements using skill vectors. |

---

## Setup Instructions

### Prerequisites

- Python 3.11+
- Node.js 18+
- npm or yarn
- MongoDB Atlas account (or local MongoDB)
- Neo4j AuraDB account (or local Neo4j)
- Redis (Upstash or local)

### 1. Clone the repository

```bash
git clone https://github.com/PurpleDrip/Adaptive-Developer-Twin.git
cd ADT-v1
```

### 2. Configure environment variables

Copy the `.env.example` to `.env` and fill in your credentials:

```env
# Neo4j
NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
NEO4J_USER=your-user
NEO4J_PASSWORD=your-password

# MongoDB
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/adt_db

# Redis
REDIS_URL=rediss://default:token@your-redis-host:6379

# Service URLs (local dev)
AUTH_URL=http://127.0.0.1:8001
TELEMETRY_URL=http://127.0.0.1:8002
TASK_URL=http://127.0.0.1:8003
ANALYTICS_URL=http://127.0.0.1:8004
FUSION_URL=http://127.0.0.1:8005
MONITORING_URL=http://127.0.0.1:8007
THG_URL=http://127.0.0.1:8008
ALLOCATION_URL=http://127.0.0.1:8009
```

### 3. Install Python dependencies

```bash
pip install fastapi uvicorn motor neo4j httpx passlib[bcrypt] redis pydantic python-dotenv
```

### 4. Seed the databases

```bash
# Seed MongoDB with demo data
python scripts/seed_production_demo.py

# Seed Neo4j — run the Cypher script in Neo4j Browser
# (See scripts/ directory for the full Cypher seed)

# Inject demo assessment
python scripts/inject_demo_test.py
```

### 5. Start the backend (all 9 services)

```powershell
./scripts/run_backend.ps1
```

This launches all 9 microservices in parallel on ports 8000-8009.

### 6. Start the frontend

```bash
cd frontend-nextjs
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## VS Code Extension Setup

1. Open the `extension/` folder in VS Code
2. Press `F5` to launch the Extension Development Host
3. In the command palette, run: `ADT: Set Extension ID`
4. Enter the Extension ID you received during registration (e.g. `ADT-DX-101`)
5. The extension will perform a hardware handshake and begin sending telemetry

> **Note:** The hardware lock is permanent. Once the Extension ID is anchored to your machine, it cannot be transferred to another device.

---

## Demo Credentials

| Role | Username | Password | Dashboard |
|:---|:---|:---|:---|
| Developer | `dev_1` through `dev_10` | `demo123` | `/dashboard` |
| Manager | `manager_1` through `manager_10` | `demo123` | `/project-manager` |
| Tech Admin | `admin_root` | `demo123` | `/tech` |

---

## API Documentation

Each service has built-in Swagger UI:

| Service | Swagger URL |
|:---|:---|
| Auth | http://127.0.0.1:8001/docs |
| Task | http://127.0.0.1:8003/docs |
| Analytics | http://127.0.0.1:8004/docs |
| THG | http://127.0.0.1:8008/docs |

A Postman collection is also available at `postman/ADT_Full_Test_Suite.postman_collection.json`.

---

## Algorithms

ADT is powered by 10 named algorithms:

| # | Name | Purpose |
|:--|:---|:---|
| 1 | **CodeBERT** | Deep learning model that understands code intent during repository analysis |
| 2 | **SCM-Audit** | AST-based parser that maps code patterns to the THG Skill Taxonomy |
| 3 | **SWEF-Ingestion** | Sliding window engine that converts raw telemetry into productivity metrics |
| 4 | **SHA-HWID** | Cryptographic hardware anchor that prevents identity spoofing |
| 5 | **BGSC-Feedback** | Bounded gradient algorithm that ensures stable, incremental skill evolution |
| 6 | **EVC-Influence** | PageRank-based engine for identifying organizational knowledge hubs |
| 7 | **CSA-Matching** | Cosine similarity engine for AI-powered task-to-developer allocation |
| 8 | **VDA-Oversight** | Time-series regression for predicting developer burnout |
| 9 | **Polymorphic Auth** | Cross-collection login scanner for multi-tenant identity isolation |
| 10 | **Cypher Fallback** | Resilience layer ensuring graph functionality when GDS plugins are unavailable |

---

## License

Proprietary — All rights reserved.
