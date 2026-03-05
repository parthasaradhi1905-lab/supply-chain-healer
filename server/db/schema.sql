-- Aegis Nexus Database Schema
-- Phase 1: Foundation Layer

-- Users table (RBAC: Buyer, Supplier, Admin)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('buyer', 'supplier', 'admin')),
    company_name TEXT,
    email TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(username, role)
);

-- Suppliers table (Primary + 15 Alternatives)
CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('primary', 'alternative')),
    location TEXT NOT NULL,
    country TEXT NOT NULL,
    stock_capacity INTEGER NOT NULL CHECK(stock_capacity > 0),
    cost_per_unit REAL NOT NULL CHECK(cost_per_unit > 0),
    lead_time_days INTEGER NOT NULL CHECK(lead_time_days > 0),
    reliability_score REAL NOT NULL CHECK(reliability_score >= 0 AND reliability_score <= 100),
    specialty TEXT NOT NULL,
    contact_email TEXT,
    transport_modes TEXT, -- JSON array: ["sea", "air"]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table (Buyer's purchase orders)
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    buyer_id INTEGER NOT NULL,
    primary_supplier_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK(quantity > 0),
    unit_price REAL NOT NULL,
    total_cost REAL NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('pending_invoice', 'active', 'processing', 'confirmed', 'at_risk', 'recovered', 'completed', 'cancelled')),
    expected_delivery DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES users(id),
    FOREIGN KEY (primary_supplier_id) REFERENCES suppliers(id)
);

-- Shipments table (Logistics tracking)
CREATE TABLE IF NOT EXISTS shipments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    supplier_id INTEGER NOT NULL,
    route TEXT NOT NULL, -- "Shanghai → Los Angeles"
    transport_mode TEXT NOT NULL CHECK(transport_mode IN ('sea', 'air', 'rail', 'road')),
    status TEXT NOT NULL CHECK(status IN ('pending', 'in_transit', 'delayed', 'rerouted', 'delivered')),
    current_location TEXT,
    departure_date DATE,
    eta TIMESTAMP,
    actual_delivery TIMESTAMP,
    tracking_updates TEXT, -- JSON array of status updates
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- Disruptions table (Crisis events)
CREATE TABLE IF NOT EXISTS disruptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK(type IN ('suez_blockage', 'hurricane', 'labor_strike', 'port_congestion', 'pandemic', 'LOGISTICS', 'LABOR', 'NATURAL_DISASTER', 'INFRASTRUCTURE', 'GEOPOLITICAL')),
    title TEXT NOT NULL,
    severity TEXT NOT NULL CHECK(severity IN ('low', 'medium', 'high', 'critical', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    affected_routes TEXT NOT NULL, -- JSON array: ["Suez Canal", "Pacific Northwest"]
    affected_transport_modes TEXT, -- JSON array: ["sea"]
    impact_description TEXT,
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1))
);

-- Recovery Plans table (AI-generated solutions)
CREATE TABLE IF NOT EXISTS recovery_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    disruption_id INTEGER NOT NULL,
    alternative_supplier_id INTEGER NOT NULL,
    plan_label TEXT NOT NULL, -- "Plan A", "Plan B", "Plan C"
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    total_cost REAL NOT NULL,
    new_lead_time_days INTEGER NOT NULL,
    cost_increase_percent REAL NOT NULL,
    time_increase_percent REAL NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('proposed', 'accepted', 'rejected', 'executed')),
    rejection_reason TEXT,
    ai_reasoning TEXT, -- Chain-of-thought from negotiator agent
    contract_pdf_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    decided_at TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (disruption_id) REFERENCES disruptions(id),
    FOREIGN KEY (alternative_supplier_id) REFERENCES suppliers(id)
);

-- Agent Logs table (AI reasoning stream)
CREATE TABLE IF NOT EXISTS agent_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_name TEXT NOT NULL CHECK(agent_name IN ('sentinel', 'analyst', 'negotiator', 'logistics_legal', 'news_agent', 'weather_agent', 'risk_scorer', 'impact_analyzer', 'supplier_evaluator', 'contract_generator', 'orchestrator')),
    disruption_id INTEGER,
    recovery_plan_id INTEGER,
    reasoning TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (disruption_id) REFERENCES disruptions(id),
    FOREIGN KEY (recovery_plan_id) REFERENCES recovery_plans(id)
);

-- External Events table (from NewsAgent/WeatherAgent)
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_type TEXT NOT NULL CHECK(source_type IN ('NEWS', 'WEATHER')),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    severity TEXT NOT NULL,
    location_country TEXT,
    location_city TEXT,
    location_latitude REAL,
    location_longitude REAL,
    impact_radius INTEGER, -- km, for weather events
    confidence REAL,
    keywords TEXT, -- JSON array
    source_url TEXT,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed INTEGER DEFAULT 0 CHECK(processed IN (0, 1))
);

-- Contracts table (generated by ContractGenerator)
CREATE TABLE IF NOT EXISTS contracts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contract_id TEXT UNIQUE NOT NULL, -- e.g. "EPR-2026-001"
    type TEXT NOT NULL CHECK(type IN ('SPOT_BUY', 'EXPEDITED_PURCHASE', 'TEMPORARY_AGREEMENT')),
    status TEXT NOT NULL CHECK(status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'EXECUTED', 'CANCELLED')),
    supplier_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    recovery_plan_id INTEGER,
    unit_price REAL NOT NULL,
    total_value REAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_terms TEXT,
    lead_time_days INTEGER,
    transport_mode TEXT,
    shipping_terms TEXT,
    duration_days INTEGER DEFAULT 90,
    content_json TEXT, -- Full contract sections as JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (recovery_plan_id) REFERENCES recovery_plans(id)
);

CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT UNIQUE NOT NULL,
    order_id INTEGER NOT NULL,
    supplier_id INTEGER NOT NULL,
    buyer_id INTEGER NOT NULL,
    -- Invoice Details
    subtotal REAL NOT NULL,
    tax_rate REAL DEFAULT 0.18,
    tax_amount REAL NOT NULL,
    shipping_cost REAL DEFAULT 0,
    total_amount REAL NOT NULL,
    -- Status
    status TEXT NOT NULL CHECK(status IN ('draft', 'pending_approval', 'approved', 'rejected')),
    rejection_reason TEXT,
    -- Dates
    issue_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Relations
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (buyer_id) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_suppliers_type ON suppliers(type);
CREATE INDEX IF NOT EXISTS idx_suppliers_capacity ON suppliers(stock_capacity);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_disruptions_active ON disruptions(is_active);
CREATE INDEX IF NOT EXISTS idx_recovery_plans_status ON recovery_plans(status);
CREATE INDEX IF NOT EXISTS idx_events_processed ON events(processed);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
