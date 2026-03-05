# Aegis Nexus - Frontend Client

**Dark Industrial UI for Supply Chain Control Tower**

Built with React 18, Vite, Tailwind CSS, and React Router.

## 🎨 Design Features

- **Dark Industrial Theme**: Deep navy backgrounds with vibrant cyan/green accents
- **Glassmorphism**: Frosted glass effect cards with backdrop blur
- **Futuristic Typography**: Orbitron (headings), Inter (body), JetBrains Mono (data)
- **Micro-animations**: Smooth transitions, hover effects, pulsing indicators
- **Responsive**: Optimized for desktop and tablet

## 🚀 Quick Start

```bash
# Install dependencies (once Node.js is installed)
npm install

# Start development server
npm run dev

# Access at http://localhost:5173
```

## 📂 Project Structure

```
client/src/
├── components/
│   ├── Navbar.jsx           # Top navigation with user info
│   ├── GaugeChart.jsx       # KPI gauge with color coding
│   ├── ShipmentMap.jsx      # Route visualization
│   ├── CrisisModal.jsx      # Plan A vs Plan B comparison
│   └── AlertBadge.jsx       # Severity-based alerts
├── pages/
│   ├── LoginPage.jsx        # Centralized auth
│   ├── BuyerDashboard.jsx   # Manufacturer portal
│   └── SupplierDashboard.jsx # Vendor portal
├── context/
│   └── AuthContext.jsx      # Authentication state
├── utils/
│   └── api.js               # Axios instance
├── App.jsx                  # Router & routes
├── main.jsx                 # Entry point
└── index.css                # Tailwind + custom styles
```

## 🔐 Test Accounts

| Role | Username | Password |
|------|----------|----------|
| Buyer | `buyer_acme` | `buyer123` |
| Supplier | `supplier_techforge` | `supplier123` |
| Admin | `admin` | `admin123` |

## 🎯 Features by Role

### Buyer Dashboard
- **KPI Gauges**: Production Risk, Inventory Days
- **Shipment Map**: Real-time route tracking
- **Crisis Modal**: AI recovery plan comparison
- **Orders Table**: Active orders with status

### Supplier Dashboard
- **Order Intake**: Confirm/decline incoming orders
- **Route Status**: Active shipments with progress
- **Alert Center**: Disruption notifications

## 🛠️ Tech Stack

- **React 18**: Component framework
- **Vite**: Fast build tool
- **Tailwind CSS**: Utility-first styling
- **React Router**: Client-side routing
- **Recharts**: Data visualization
- **Lucide React**: Modern icons
- **Axios**: HTTP client

## 🎨 Color Palette

```css
Primary Background:   #0a0e1a (Deep Navy)
Secondary Background: #131825
Elevated Background:  #1a2234

Accent Primary:       #00d9ff (Cyan)
Accent Success:       #00ff88 (Neon Green)
Accent Warning:       #ffaa00 (Amber)
Accent Danger:        #ff3366 (Hot Pink)

Text Primary:         #ffffff
Text Secondary:       #94a3b8
Text Muted:           #64748b
```

## 📝 Development Notes

- **Protected Routes**: RBAC enforced via `ProtectedRoute` wrapper
- **Auto-redirect**: Users redirect to role-appropriate dashboard
- **Mock Data**: Currently using local mock data (will connect to backend API in Phase 3)
- **Simulated Auth**: Login validation will be connected to backend in Phase 3

## ✅ Phase 2 Status: COMPLETE

All UI/UX components built and styled with dark industrial theme.
