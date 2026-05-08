# Adaptive Developer Twin (ADT)

> An AI-powered "Engineering Intelligence System" that creates a Neural Twin of every developer in an organization. By fusing semantic code analysis, hardware-anchored telemetry, and high-density graph analytics, ADT provides a real-time source of truth for skill growth, organizational influence, and resource allocation.

---

## 🏛️ The 10 Pillar Algorithms

ADT is powered by a proprietary stack of 10 specialized algorithms that ensure the platform remains the most reliable and unmanipulatable source of truth in engineering leadership:

| # | Name | Application | Purpose |
|:--|:---|:---|:---|
| 1 | **CodeBERT** | Fusion Service | Deep learning brain that understands semantic code intent during audits. |
| 2 | **SCM-Audit** | Fusion Service | AST-based parser mapping technical footprints to the THG Skill Taxonomy. |
| 3 | **SWEF-Ingestion**| Telemetry Service| Sliding-window engine turning messy raw streams into productivity metrics. |
| 4 | **SHA-HWID Anchor**| Auth/Security | Cryptographic lock tying an Extension ID to a physical machine. |
| 5 | **BGSC-Feedback** | Task Service | Guardrail algorithm ensuring skill growth is incremental and verified. |
| 6 | **EVC-Influence** | THG Service | PageRank-based engine identifying organizational "Knowledge Hubs." |
| 7 | **CSA-Matching** | Task Service | Multi-dimensional vector engine for mathematically perfect task-to-dev "Fit." |
| 8 | **VDA-Oversight** | Analytics Service | Linear regression predicting burnout and velocity decay before they happen. |
| 9 | **Async-Redis-WS** | Monitoring Service| Non-blocking event streaming for the real-time Live Audit HUD. |
| 10| **Native Cypher** | THG Service | Proprietary fallback logic ensuring graph resilience if GDS plugins are offline. |

---

## 🛡️ Zero-Trust Security Perimeter

To ensure data integrity, ADT implements a multi-layer security perimeter:
- **Hardware Anchoring**: Every Extension ID is permanently locked to a machine's CPU/Motherboard hash (SHA-HWID).
- **Server-Side Fusion**: All behavioral analysis happens in the backend "Black Box," preventing developers from spoofing metrics.
- **Identity Isolation**: Managers, Developers, and Tech Admins are stored in isolated database silos to prevent role escalation.
- **Single-Attempt Assessments**: Verification tests are locked to a single attempt, with results directly evolving the Neural Twin via the BGSC algorithm.

---

## 🛠️ Architecture

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

**Persistence Layer:**
- **MongoDB Atlas**: User profiles, high-density task metadata, and telemetry batches.
- **Neo4j AuraDB**: The "Neural Twin" repository (skills, relationships, influence).
- **Redis (Upstash)**: Real-time Pub/Sub for the Monitoring WebSocket.

---

## 🛰️ Services Overview

| Service | Port | Core Functions |
|:---|:---|:---|
| **Gateway** | 8000 | Unified entry point; handles CORS, routing, and centralized error handling. |
| **Auth** | 8001 | Polymorphic identity management across 3 isolated silos. Manages SHA-HWID locks. |
| **Telemetry** | 8002 | Ingests SHEC-encrypted streams. Features a dynamic heartbeat (system-config driven). |
| **Task** | 8003 | Manual/AI Task creation, CSA-Matching, and the Weekly Verification Engine. |
| **Analytics** | 8004 | Behavioral insight generation, composite leaderboards, and VDA risk analysis. |
| **Fusion** | 8005 | SCM-Audit engine for deep repository scanning and initial skill vectoring. |
| **Monitoring** | 8007 | Real-time **Live Audit HUD** powered by Async-Redis-WS. |
| **THG** | 8008 | Neo4j Master — PageRank influence, skill evolution, and topology mapping. |
| **Allocation** | 8009 | Vector Space engine for candidate ranking and fit probability. |

---

## 🚀 Setup Instructions

### 1. Prerequisites
- Python 3.11+
- Node.js 18+
- Active MongoDB, Neo4j, and Redis (Upstash) instances.

### 2. Environment Configuration
Copy `.env.example` to `.env` and configure your database strings. Ensure `REDIS_URL` uses the `rediss://` protocol for secure Upstash connections.

### 3. Database Seeding (Nuclear Reset)
```bash
# Wipe and seed all collections with deterministic production data
python scripts/seed_production_demo.py
```

### 4. Running the Mesh
```powershell
# Launch all 9 microservices in parallel
./scripts/run_backend.ps1

# Launch the React/Next.js dashboard
cd frontend-nextjs
npm run dev
```

---

## 👥 Role-Based Workflows

### 💻 Developer (`/dashboard`)
Focus on **Neural Twin Evolution**. Developers use a high-density Radar HUD to track their skill growth, take manager-issued assessments, and view their organizational rank.
> **Key Tool**: VS Code Extension (SHEC Protocol Enabled).

### 💼 Project Manager (`/project-manager`)
The **Squad Orchestration** center. Provides deep-dive oversight into squad velocity, burnout risks, and AI-powered task allotment.
> **Key Tool**: HRM Command Console with Candidate Vector Matching.

### ⚙️ Tech Admin (`/tech`)
**Infrastructure Mastery**. Real-time monitoring of the entire microservice mesh and global audit trail via the Live Audit HUD.
> **Key Tool**: System-Config Controller for dynamic telemetry intervals.

---

## 📜 License
Proprietary — Adaptive Developer Twin Platform (v2.0)
