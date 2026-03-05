# 🛡️ Aegis Nexus - AI-Powered Supply Chain Control Tower

**Self-Healing Supply Chain** platform that autonomously detects disruptions and executes recovery plans using 4 AI agents.

![Status](https://img.shields.io/badge/Status-Production%20Ready-success)
![Phase 3](https://img.shields.io/badge/Phase%203-Complete-blue)
![100% Filter](https://img.shields.io/badge/100%25%20Quantity%20Filter-Enforced-green)

---

## 🎯 Overview

Aegis Nexus demonstrates **Autonomous Supply Chain Healing** through AI agents that:
1. **Detect** global disruptions (Suez blockages, hurricanes, strikes)
2. **Analyze** impact on production risk and inventory
3. **Find** alternative suppliers with **100% capacity guarantee**
4. **Generate** emergency procurement contracts
5. **Present** recovery plans to buyers for approval
6. **Iterate** if rejected, finding next best alternatives

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone repository
git clone <your-repo-url>
cd supply-chain-healer

# Install root dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..

# Initialize database with 15 alternative suppliers
npm run db:reset

# Run tests to verify 100% quantity filter
npm run test:db
```

### Run Full Stack

```bash
# Terminal 1: Start backend (port 3001)
npm run dev

# Terminal 2: Start frontend (port 5173)
cd client
npm run dev
```

Navigate to `http://localhost:5173`

---

## 📸 Demo Flow

### 1. Login as Admin
```
Username: admin
Password: admin123
```

### 2. Trigger Crisis
- Select Order #1 (10,000 microcontrollers)
- Click **[⚓ Suez Blockage]**
- Watch AI agents execute in real-time

### 3. AI Reasoning Streams to Terminal
```
[SENTINEL] 🛡️ Suez Canal blockage detected
[ANALYST] 📊 Risk Level: HIGH (82%)
[NEGOTIATOR] 🤝 Found 12 suppliers (100% capacity filter)
[LOGISTICS] 📄 Contract EPR-2026-001 generated
```

### 4. Crisis Modal Appears
- **Plan A (Failed)**: Shanghai Electronics - BLOCKED
- **Plan B (Recovery)**: TechForge Industries - $125K, 14 days

### 5. Accept or Reject
- ✅ **Accept**: Order status → "recovered"
- ❌ **Reject**: AI finds Plan C automatically

---

## 🧠 The 4 AI Agents

| Agent | Role | Key Feature |
|-------|------|-------------|
| 🛡️ **Sentinel** | Disruption Scanner | Detects 3 crisis types |
| 📊 **Analyst** | Impact Calculator | Calculates 0-100% risk |
| 🤝 **Negotiator** | Supplier Finder | **100% quantity filter enforced** |
| 📄 **Logistics** | Contract Generator | Creates emergency contracts |

---

## 🔬 Technical Highlights

### Phase 1: Database Foundation ✅
- SQLite with 7 tables (users, suppliers, orders, shipments, disruptions, recovery_plans, agent_logs)
- **15 diverse alternative suppliers** seeded globally
- **100% quantity constraint** hard-coded in `Supplier.findAlternatives()`
- Comprehensive test suite validates filter logic

### Phase 2: Frontend UI ✅
- React 18 + Vite + Tailwind CSS
- **Dark industrial theme** with glassmorphism
- Buyer, Supplier, and Admin dashboards
- Protected routes with RBAC

### Phase 3: AI Intelligence ✅
- 4 autonomous agents with Chain-of-Thought reasoning
- Agent Orchestrator coordinates workflow
- Admin simulation panel (3 disruption types)
- Real-time streaming terminal
- Plan iteration on rejection

---

## 📁 Project Structure

```
supply-chain-healer/
├── server/
│   ├── ai/
│   │   ├── AgentOrchestrator.js
│   │   └── agents/
│   │       ├── SentinelAgent.js
│   │       ├── AnalystAgent.js
│   │       ├── NegotiatorAgent.js (100% filter)
│   │       └── LogisticsAgent.js
│   ├── api/
│   │   └── routes.js (AI endpoints)
│   ├── db/
│   │   ├── init.js
│   │   └── schema.sql
│   ├── models/
│   │   ├── Supplier.js (100% filter logic)
│   │   ├── Order.js
│   │   ├── Disruption.js
│   │   └── RecoveryPlan.js
│   └── index.js
├── client/src/
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── BuyerDashboard.jsx
│   │   ├── SupplierDashboard.jsx
│   │   └── AdminDashboard.jsx
│   ├── components/
│   │   ├── AgentTerminal.jsx
│   │   ├── CrisisModal.jsx
│   │   ├── GaugeChart.jsx
│   │   └── ShipmentMap.jsx
│   └── context/
│       └── AuthContext.jsx
└── package.json
```

---

## 🎨 UI Features

- **Glassmorphism cards** with frosted glass effect
- **Futuristic typography**: Orbitron, Inter, JetBrains Mono
- **Color palette**:
  - Primary: Deep Navy (#0a0e1a)
  - Accent: Vibrant Cyan (#00d9ff)
  - Success: Neon Green (#00ff88)
  - Danger: Hot Pink (#ff3366)
- **Micro-animations** for hover states and transitions
- **Agent Terminal** with color-coded agents

---

## 🧪 Testing

```bash
# Run database tests (validates 100% quantity filter)
npm run test:db

# Expected output:
# ✓ Returns only suppliers >= required quantity
# ✓ Excludes suppliers below threshold
# ✓ Handles edge cases (exact capacity, exclusions)
```

---

## 🔐 Test Accounts

| Role | Username | Password | Access |
|------|----------|----------|--------|
| **Admin** | `admin` | `admin123` | Simulation panel |
| **Buyer** | `buyer_acme` | `buyer123` | Crisis approval |
| **Supplier** | `supplier_techforge` | `supplier123` | Order intake |

---

## 🌍 15 Alternative Suppliers

| ID | Name | Location | Capacity | Cost | Reliability |
|----|------|----------|----------|------|-------------|
| 2 | TechForge Industries | Shenzhen, China | 50,000 | $12.50 | 92% |
| 3 | Singapore Logistics Pro | Singapore | 22,000 | $13.80 | 91% |
| 4 | Ho Chi Minh Components | Vietnam | 35,000 | $10.50 | 86% |
| 5 | Detroit AutoParts | Michigan, USA | 45,000 | $18.00 | 94% |
| ... | ... | ... | ... | ... | ... |

*See `db/seed.sql` for complete list*

---

## 📊 API Endpoints

### AI Endpoints

```http
POST /api/ai/trigger-crisis
Body: { disruptionType, orderId }

POST /api/ai/accept-plan
Body: { planId, orderId }

POST /api/ai/reject-plan
Body: { planId, reason, orderId }
```

### Standard CRUD

```http
GET  /api/orders
GET  /api/suppliers/alternatives?quantity=10000
POST /api/disruptions
GET  /api/recovery-plans?order_id=1
```

---

## 🎯 Key Business Rule

> [!IMPORTANT]
> **100% Quantity Constraint**
> 
> The Negotiator Agent ONLY returns suppliers whose `stock_capacity >= required_quantity`.
> - Hard-coded in `Supplier.findAlternatives()`
> - Validated by test suite
> - NO partial fulfillment allowed
> - Logged in Agent Terminal: "Found X suppliers meeting 100% capacity requirement"

---

## 🛠️ Tech Stack

**Backend:**
- Node.js + Express.js
- SQLite3 (development)
- Better-SQLite3 (testing)

**Frontend:**
- React 18
- Vite
- Tailwind CSS v3
- React Router v6
- Recharts
- Lucide React

---

## 📝 Available Scripts

```bash
# Backend
npm run dev          # Start server (port 3001)
npm run db:reset     # Reinitialize database
npm run test:db      # Run 100% filter tests

# Frontend (in /client)
npm run dev          # Start Vite dev server (port 5173)
npm run build        # Production build
npm run preview      # Preview production build
```

---

## 🎥 Demo Scenario

**Step 1**: Admin triggers Suez Canal blockage  
**Step 2**: Sentinel detects crisis  
**Step 3**: Analyst calculates 82% risk  
**Step 4**: Negotiator finds TechForge ($125K, 14 days)  
**Step 5**: Logistics generates contract EPR-2026-001  
**Step 6**: Crisis modal appears on buyer dashboard  
**Step 7**: Buyer accepts → Order status: "recovered" ✅

**Total time**: ~5 seconds from trigger to resolution

---

## 🚧 Future Enhancements

- [ ] PDF contract generation (PDFKit or Puppeteer)
- [ ] Real LLM integration (OpenAI GPT-4)
- [ ] WebSocket streaming instead of simulated delays
- [ ] Multi-supplier split orders (if no 100% match)
- [ ] Historical analytics dashboard
- [ ] Email notifications on crisis detection

---

## 📄 License

MIT License - See LICENSE file

---

## 🙏 Acknowledgments

Built as a demonstration of **Autonomous AI Agents** in supply chain management.

**All 3 Phases Complete**: Database + UI + AI Intelligence 🎉

---

**Need Help?** Check `/docs/walkthrough.md` for detailed documentation.