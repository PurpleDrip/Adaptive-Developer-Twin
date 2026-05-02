# Adaptive Developer Twin (ADT-v1) - Production Ready

ADT-v1 is a production-grade, microservices-based developer life-cycle management system. It uses advanced AI to track developer skills, predict burnout, and optimize task allocation.

## 🚀 Key Features
- **Temporal Heterogeneous Graph (THG)**: A live Neo4j-based graph that tracks skills with temporal decay.
- **AI Fusion Engine**: Combines telemetry, project analysis, and reviews using CodeBERT and Bayesian Fusion.
- **Smart Allocation**: Uses the Hungarian Algorithm for global optimal task assignments.
- **Predictive Analytics**: GRU/LSTM models for burnout detection and XGBoost for success probability.
- **VS Code Extension**: Native integration for high-precision telemetry and task notifications.
- **Premium Dashboards**: Dark-mode, glassmorphic analytics for Developers, HRM, and Senior Devs.

## 🏗 Architecture
The system consists of 9 microservices organized in the `backend/` directory:
1. **gateway**: Single entry point with routing and CORS.
2. **auth**: User registration and Extension ID management (MongoDB).
3. **telemetry**: Ingestion and 30-minute batch processing.
4. **fusion**: The AI core (CodeBERT, Bayesian Fusion).
5. **thg**: Temporal graph management (Neo4j).
6. **allocation**: Task matching and optimization.
7. **task**: Workflow management and performance feedback.
8. **analytics**: Burnout and success predictions.
9. **monitoring**: System health and audit trails.

## 🛠 Setup & Installation
1. **Prerequisites**: Docker, Docker Compose, Python 3.11+.
2. **Environment**: Copy `.env.example` to `.env` and configure credentials.
3. **Build & Start**:
   ```bash
   docker-compose up --build -d
   ```
4. **Initialize Graph**:
   ```bash
   curl -X POST http://localhost:8000/api/v1/thg/thg/generate-demo-data
   ```

## 🧪 Simulation
Run the lifecycle simulation script to see the system in action:
```bash
python scripts/simulate_lifecycle.py
```

## 📊 Dashboard Access
- **Developer Dashboard**: `http://localhost:3000/`
- **HRM Intelligence**: `http://localhost:3000/hrm`
- **Senior Dev Orchestration**: `http://localhost:3000/senior`
- **Monitoring & Audit**: `http://localhost:3000/monitoring`

