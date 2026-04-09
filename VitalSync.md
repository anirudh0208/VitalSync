Here's the full README content for your logistics app — paste this directly into Antigravity (or your repo's README.md):

markdown# 🚚 LogiSense — Intelligent Logistics Optimization System

> An AI-powered logistics control room built for real-time fleet management, predictive ETA modeling, and autonomous routing decisions.

---

## 🧭 Project Overview

LogiSense is a full-stack logistics intelligence platform that simulates a live operations center. It combines ensemble machine learning for shipment predictions, constraint-based vehicle routing (VRP), server-sent events for real-time simulation, and an embedded Claude AI assistant — all wrapped in a dark ops-center UI.

Built as an 18-hour hackathon prototype. Designed to look and behave like production.

---

## 🏗️ Architecture
┌─────────────────────────────────────────────────────┐
│                    React Frontend                   │
│  Dark Dashboard · Leaflet Map · Recharts · SSE Feed │
└────────────────────┬────────────────────────────────┘
│ REST + SSE
┌────────────────────▼────────────────────────────────┐
│                  FastAPI Backend                    │
│   /predict  /route  /assign  /stream  /chat         │
└──────┬──────────────┬──────────────┬────────────────┘
│              │              │
┌──────▼──────┐ ┌─────▼──────┐ ┌────▼───────────────┐
│  ML Engine  │ │  OR-Tools  │ │   Claude API       │
│  Ensemble   │ │    VRP     │ │   Chat Assistant   │
│  Predictor  │ │  Routing   │ │                    │
└──────┬──────┘ └─────┬──────┘ └────────────────────┘
│              │
┌──────▼──────────────▼──────────────────────────────┐
│                  SQLite (Data Layer)               │
│    shipments · vehicles · routes · predictions     │
└────────────────────────────────────────────────────┘

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Leaflet.js, Recharts, Tailwind CSS |
| Backend | FastAPI, Uvicorn |
| ML | scikit-learn (RandomForest, GradientBoosting, LogisticRegression) |
| Routing | Google OR-Tools (VRP solver) |
| Realtime | Server-Sent Events (SSE) |
| Data | SQLite, Pandas, NumPy |
| AI Assistant | Anthropic Claude API |
| Dev Tools | ngrok (tunnel), Python 3.10+, Node 18+ |

---

## 🧠 ML & AI Features

### Ensemble Prediction Engine
- **3-model ensemble**: RandomForest + GradientBoosting + LogisticRegression
- Outputs: ETA estimate, **confidence percentage**, **delay probability**
- Features used: distance, traffic index, weather score, vehicle load, time-of-day, day-of-week
- Trained on synthetic data (~5,000 shipment records generated at startup)

### VRP Routing (OR-Tools)
- Solves Vehicle Routing Problem with capacity and time-window constraints
- Greedy fallback if OR-Tools exceeds time budget
- Returns optimized multi-stop routes per vehicle

### Autonomous Decision Engine
- **Smart re-router**: triggers on delay probability > 0.65
- **Load balancer**: redistributes shipments when any vehicle exceeds 80% capacity
- **Auto-escalation**: flags critical shipments (confidence < 40%) for human review

### Claude AI Assistant
- Embedded chat panel in the dashboard
- Context-aware: reads live shipment + fleet state before responding
- Handles queries like: *"Which shipments are at risk?"*, *"Rebalance fleet for Zone B"*, *"Explain this delay"*

---

## 📡 Real-Time Simulation

Uses **Server-Sent Events (SSE)** — no WebSockets needed.

- Shipments auto-tick every 3 seconds: coordinates update, status transitions
- Live KPI cards recalculate on each tick (on-time %, active vehicles, avg ETA)
- Animated route lines on the Leaflet map pulse on status change
- Frontend `EventSource` connects to `/stream` endpoint

---

## 🗂️ Project Structure
logisense/
├── backend/
│   ├── main.py              # FastAPI app, all routes
│   ├── ml/
│   │   ├── predictor.py     # Ensemble model training + inference
│   │   └── synthetic_data.py# Dataset generation
│   ├── routing/
│   │   └── vrp_solver.py    # OR-Tools VRP wrapper
│   ├── automation/
│   │   └── decision_engine.py # Re-router, load balancer, escalation
│   ├── sse/
│   │   └── simulator.py     # Live shipment tick simulation
│   └── db/
│       └── database.py      # SQLite models + seed data
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx     # Main ops-center layout
│   │   │   ├── ShipmentMap.jsx   # Leaflet map with animated routes
│   │   │   ├── KPICards.jsx      # Live metric cards
│   │   │   ├── FleetTable.jsx    # Vehicle status table
│   │   │   ├── PredictionPanel.jsx # ML output with confidence bars
│   │   │   └── AIAssistant.jsx   # Claude chat widget
│   │   ├── hooks/
│   │   │   └── useSSE.js         # SSE connection hook
│   │   └── App.jsx
│   └── package.json
├── requirements.txt
└── README.md

---

## 🚀 Quickstart

### 1. Clone & install

```bash
git clone https://github.com/your-username/logisense.git
cd logisense
```

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```

### 2. Environment Variables

Create `backend/.env`:
```env
ANTHROPIC_API_KEY=your_api_key_here
```

### 3. Expose via ngrok (for demo)

```bash
ngrok http 8000
```

Update `frontend/src/config.js` with the ngrok URL.

---

## 🔌 API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/predict` | POST | Run ensemble ETA + delay prediction |
| `/route` | POST | Solve VRP for given vehicle + stops |
| `/assign` | POST | Auto-assign shipments to optimal vehicle |
| `/rebalance` | POST | Trigger load balancer across fleet |
| `/escalate` | GET | Get list of flagged high-risk shipments |
| `/stream` | GET | SSE stream of live shipment updates |
| `/chat` | POST | Send message to Claude AI assistant |
| `/health` | GET | Service status check |

### Sample `/predict` request

```json
{
  "shipment_id": "SHP-042",
  "distance_km": 34.5,
  "traffic_index": 0.72,
  "weather_score": 0.3,
  "vehicle_load_pct": 65,
  "hour_of_day": 14,
  "day_of_week": 2
}
```

### Sample `/predict` response

```json
{
  "eta_minutes": 52,
  "confidence": 84,
  "delay_probability": 0.18,
  "recommendation": "ON_TRACK",
  "model_votes": {
    "random_forest": 51,
    "gradient_boosting": 53,
    "logistic_regression": "on_time"
  }
}
```

---

## 🎨 UI Design

- **Theme**: Dark ops-center (`#0d1117` base, `#00ff9d` accent)
- **Map tiles**: CartoDB Dark Matter (`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`)
- **Route animation**: CSS keyframe pulse on active Leaflet polylines
- **Status colors**: Green (delivered) · Amber (delayed) · Red (critical) · Blue (in transit)

---

## 🏆 Demo Script (5 minutes)

| Time | What to show |
|------|-------------|
| 0:00–0:45 | Live map — point to animated shipments moving in real-time |
| 0:45–1:30 | Trigger a prediction — show confidence % and delay probability |
| 1:30–2:15 | Simulate a delay — watch auto re-router kick in autonomously |
| 2:15–3:00 | Ask Claude assistant: *"Which shipments need attention right now?"* |
| 3:00–3:45 | Show KPI cards updating live, fleet load balancer firing |
| 3:45–5:00 | Architecture walkthrough + Q&A |

**Killer lines for judges:**
- *"The system makes routing decisions faster than any human dispatcher could."*
- *"Every prediction comes with a confidence score — we don't just predict, we quantify uncertainty."*
- *"The AI assistant has full situational awareness of the live fleet state before it responds."*

---

## ⚠️ Known Limitations (Hackathon Scope)

- All shipment data is synthetic — no real GPS or carrier APIs
- No authentication layer
- SQLite only — not production-scalable
- Weather and traffic are simulated indices, not real API data
- Claude assistant context window resets per session

---

## 🛣️ What's Next (Post-Hackathon)

- Integrate real carrier APIs (ShipRocket, FedEx)
- Replace SQLite with PostgreSQL + Redis
- Add user auth + role-based access (dispatcher vs manager)
- Deploy on Railway / Render with CI/CD
- Train ML on real logistics datasets (e.g., Brazilian E-Commerce on Kaggle)
- WebSocket upgrade for sub-second latency

---

## 👥 Team

Built at [Hackathon Name] · [Date] · [Team Name]

| Name | Role |
|------|------|
| — | ML & Backend |
| — | Frontend & UI |
| — | Routing & Automation |
| — | Integration & Demo |

---

## 📄 License

MIT — use freely, build on it, ship it.