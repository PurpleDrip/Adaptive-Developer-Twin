# ADT Next.js Command Center

This is the high-fidelity frontend for the **Adaptive Developer Twin (ADT-v1)** ecosystem. It provides the primary interface for Developers, Project Managers, and Tech Ops to interact with the intelligence layer.

## 🚀 Key Modules

### 1. Developer Portal (`/dashboard`)
- **Real-time Skill Tracking**: Visualized via temporal decay graphs.
- **Burnout Analytics**: Proactive monitoring of engineering velocity.
- **Task Hub**: Integrated task management with AI-driven priority suggestions.

### 2. PM Orchestration (`/project-manager`)
- **Team Allocation Matrix**: Global optimization of human capital.
- **Success Forecasting**: Predict project outcomes based on historical telemetry.
- **Resource Management**: Dynamic team reshuffling based on real-time skill gaps.

### 3. Tech Ops Nexus (`/tech`)
- **System-X Command Center**: 1200px high-density topology graph.
- **Blueprint Mode**: Interactive infrastructure management with XYFlow.
- **Live Shard Explorer**: Direct access to identity and whitelist databases.

## 🛠 Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4 (Pure-Black Aesthetic)
- **State & Logic**: React Hooks, Axios
- **Visualization**: XYFlow (React Flow), Lucide Icons
- **Typography**: Geist (Surgical Precision font family)

## 🚦 Getting Started

### Development
```bash
npm install
npm run dev
```

### Environment Configuration
Ensure your `.env.local` points to the ADT Gateway:
```env
NEXT_PUBLIC_GATEWAY_URL=http://localhost:8000/api/v1
```

---
PurpleDrip/Adaptive-Developer-Twin • Frontend v1.2.0
