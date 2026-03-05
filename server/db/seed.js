import bcrypt from 'bcrypt';
import sqlite3 from 'sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname as pathDirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = pathDirname(__filename);
const DB_PATH = process.env.DATABASE_PATH || './aegis.db';

console.log('🌱 Seeding Aegis Nexus Database...\n');

const db = new sqlite3.Database(DB_PATH);
const schemaPath = join(__dirname, 'schema.sql');
const schema = readFileSync(schemaPath, 'utf-8');

db.serialize(() => {
    // Create schema first
    db.run('PRAGMA foreign_keys = ON');
    db.exec(schema);

    console.log('✅ Schema created');

    // ========================================
    // 1. SEED USERS
    // ========================================
    console.log('👥 Creating users...');

    const users = [
        { username: 'buyer_acme', password: 'buyer123', role: 'buyer', company_name: 'ACME Manufacturing Corp', email: 'procurement@acme.com' },
        { username: 'supplier_techforge', password: 'supplier123', role: 'supplier', company_name: 'TechForge Industries', email: 'sales@techforge.cn' },
        { username: 'admin', password: 'admin123', role: 'admin', company_name: 'Aegis Control Tower', email: 'admin@aegisnexus.com' }
    ];

    const userStmt = db.prepare(`INSERT OR IGNORE INTO users (username, password_hash, role, company_name, email) VALUES (?, ?, ?, ?, ?)`);
    users.forEach(u => {
        const hash = bcrypt.hashSync(u.password, 10);
        userStmt.run(u.username, hash, u.role, u.company_name, u.email);
        console.log(`  ✓ ${u.role}: ${u.username}`);
    });
    userStmt.finalize();

    // ========================================
    // 2. SEED SUPPLIERS (1 Primary + 16 Alternatives)
    // ========================================
    console.log('\n🏭 Creating suppliers...');

    const suppliers = [
        { name: 'Shanghai Electronics Ltd', type: 'primary', location: 'Shanghai, China', country: 'China', stock_capacity: 30000, cost_per_unit: 15.00, lead_time_days: 18, reliability_score: 89, specialty: 'Electronics', contact_email: 'orders@shanghai-elec.com', transport_modes: '["sea", "air"]' },
        { name: 'TechForge Industries', type: 'alternative', location: 'Shenzhen, China', country: 'China', stock_capacity: 50000, cost_per_unit: 12.50, lead_time_days: 14, reliability_score: 92, specialty: 'Electronics', contact_email: 'supply@techforge.cn', transport_modes: '["sea", "air", "rail"]' },
        { name: 'Nordic Steel AB', type: 'alternative', location: 'Stockholm, Sweden', country: 'Sweden', stock_capacity: 15000, cost_per_unit: 18.75, lead_time_days: 21, reliability_score: 97, specialty: 'Raw Materials', contact_email: 'contact@nordicsteel.se', transport_modes: '["sea", "rail"]' },
        { name: 'Mumbai Textiles Co', type: 'alternative', location: 'Mumbai, India', country: 'India', stock_capacity: 25000, cost_per_unit: 9.80, lead_time_days: 12, reliability_score: 84, specialty: 'Textiles', contact_email: 'export@mumbaitextiles.in', transport_modes: '["sea", "air"]' },
        { name: 'Detroit AutoParts Inc', type: 'alternative', location: 'Detroit, USA', country: 'USA', stock_capacity: 8000, cost_per_unit: 22.00, lead_time_days: 7, reliability_score: 95, specialty: 'Automotive Parts', contact_email: 'sales@detroitauto.com', transport_modes: '["road", "rail"]' },
        { name: 'São Paulo Manufacturing', type: 'alternative', location: 'São Paulo, Brazil', country: 'Brazil', stock_capacity: 12000, cost_per_unit: 14.20, lead_time_days: 28, reliability_score: 78, specialty: 'Electronics', contact_email: 'vendas@spmfg.br', transport_modes: '["sea", "air"]' },
        { name: 'Dubai Trade Hub', type: 'alternative', location: 'Dubai, UAE', country: 'UAE', stock_capacity: 20000, cost_per_unit: 16.50, lead_time_days: 10, reliability_score: 88, specialty: 'Electronics', contact_email: 'import@dubaitrade.ae', transport_modes: '["air", "sea"]' },
        { name: 'Tokyo Precision Tech', type: 'alternative', location: 'Tokyo, Japan', country: 'Japan', stock_capacity: 18000, cost_per_unit: 21.00, lead_time_days: 16, reliability_score: 98, specialty: 'Electronics', contact_email: 'orders@tokyoprecision.jp', transport_modes: '["sea", "air"]' },
        { name: 'Berlin Industrial GmbH', type: 'alternative', location: 'Berlin, Germany', country: 'Germany', stock_capacity: 10000, cost_per_unit: 19.50, lead_time_days: 19, reliability_score: 94, specialty: 'Automotive Parts', contact_email: 'vertrieb@berlinindustrial.de', transport_modes: '["rail", "road"]' },
        { name: 'Singapore Logistics Pro', type: 'alternative', location: 'Singapore', country: 'Singapore', stock_capacity: 22000, cost_per_unit: 13.80, lead_time_days: 11, reliability_score: 91, specialty: 'Electronics', contact_email: 'ops@sglogistics.sg', transport_modes: '["sea", "air"]' },
        { name: 'Mexico City Supplies', type: 'alternative', location: 'Mexico City, Mexico', country: 'Mexico', stock_capacity: 9500, cost_per_unit: 11.00, lead_time_days: 9, reliability_score: 82, specialty: 'Raw Materials', contact_email: 'ventas@mxsupplies.mx', transport_modes: '["road", "rail"]' },
        { name: 'Ho Chi Minh Components', type: 'alternative', location: 'Ho Chi Minh City, Vietnam', country: 'Vietnam', stock_capacity: 35000, cost_per_unit: 10.50, lead_time_days: 15, reliability_score: 86, specialty: 'Electronics', contact_email: 'export@hcmcomponents.vn', transport_modes: '["sea", "air"]' },
        { name: 'Istanbul Bridge Trading', type: 'alternative', location: 'Istanbul, Turkey', country: 'Turkey', stock_capacity: 14000, cost_per_unit: 13.20, lead_time_days: 17, reliability_score: 80, specialty: 'Textiles', contact_email: 'info@istanbulbridge.tr', transport_modes: '["sea", "road"]' },
        { name: 'Toronto Manufacturing Ltd', type: 'alternative', location: 'Toronto, Canada', country: 'Canada', stock_capacity: 11000, cost_per_unit: 20.00, lead_time_days: 8, reliability_score: 93, specialty: 'Automotive Parts', contact_email: 'orders@torontomfg.ca', transport_modes: '["road", "rail"]' },
        { name: 'Johannesburg Metals', type: 'alternative', location: 'Johannesburg, South Africa', country: 'South Africa', stock_capacity: 7500, cost_per_unit: 17.80, lead_time_days: 35, reliability_score: 75, specialty: 'Raw Materials', contact_email: 'sales@jbgmetals.za', transport_modes: '["sea", "air"]' },
        { name: 'Seoul Advanced Materials', type: 'alternative', location: 'Seoul, South Korea', country: 'South Korea', stock_capacity: 28000, cost_per_unit: 14.90, lead_time_days: 13, reliability_score: 96, specialty: 'Electronics', contact_email: 'export@seouladvanced.kr', transport_modes: '["sea", "air"]' },
        { name: 'Bangkok Global Supply', type: 'alternative', location: 'Bangkok, Thailand', country: 'Thailand', stock_capacity: 19000, cost_per_unit: 11.75, lead_time_days: 14, reliability_score: 87, specialty: 'Electronics', contact_email: 'contact@bangkokglobal.th', transport_modes: '["sea", "air"]' }
    ];

    const supplierStmt = db.prepare(`INSERT OR IGNORE INTO suppliers (name, type, location, country, stock_capacity, cost_per_unit, lead_time_days, reliability_score, specialty, contact_email, transport_modes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    suppliers.forEach((s, idx) => {
        supplierStmt.run(s.name, s.type, s.location, s.country, s.stock_capacity, s.cost_per_unit, s.lead_time_days, s.reliability_score, s.specialty, s.contact_email, s.transport_modes);
        if (s.type === 'primary') {
            console.log(`  ✓ PRIMARY: ${s.name}`);
        } else {
            console.log(`  ✓ ALT ${idx}: ${s.name} (${s.location})`);
        }
    });
    supplierStmt.finalize();

    // ========================================
    // 3. SEED ORDERS
    // ========================================
    console.log('\n📦 Creating orders...');

    const orders = [
        { buyer_id: 1, primary_supplier_id: 1, product_name: 'Industrial Microcontrollers', quantity: 10000, unit_price: 15.00, total_cost: 150000, status: 'active', expected_delivery: '2026-02-28' },
        { buyer_id: 1, primary_supplier_id: 1, product_name: 'Circuit Boards', quantity: 5000, unit_price: 15.00, total_cost: 75000, status: 'active', expected_delivery: '2026-03-15' }
    ];

    const orderStmt = db.prepare(`INSERT OR IGNORE INTO orders (buyer_id, primary_supplier_id, product_name, quantity, unit_price, total_cost, status, expected_delivery) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
    orders.forEach((o, idx) => {
        orderStmt.run(o.buyer_id, o.primary_supplier_id, o.product_name, o.quantity, o.unit_price, o.total_cost, o.status, o.expected_delivery);
        console.log(`  ✓ Order ${idx + 1}: ${o.quantity} x ${o.product_name}`);
    });
    orderStmt.finalize();

    // ========================================
    // 4. SEED SHIPMENTS
    // ========================================
    console.log('\n🚢 Creating shipments...');

    const shipments = [
        { order_id: 1, supplier_id: 1, route: 'Shanghai → Los Angeles', transport_mode: 'sea', status: 'in_transit', current_location: 'Suez Canal', departure_date: '2026-01-15', eta: '2026-02-25 14:00:00', tracking_updates: '[]' },
        { order_id: 2, supplier_id: 2, route: 'Shenzhen → Seattle', transport_mode: 'air', status: 'in_transit', current_location: 'Anchorage, Alaska', departure_date: '2026-02-05', eta: '2026-02-12 08:00:00', tracking_updates: '[]' },
        { order_id: 1, supplier_id: 5, route: 'Detroit → Chicago → New York', transport_mode: 'road', status: 'in_transit', current_location: 'Toledo, Ohio', departure_date: '2026-02-03', eta: '2026-02-08 16:00:00', tracking_updates: '[]' },
        { order_id: 2, supplier_id: 9, route: 'Berlin → Warsaw → Moscow', transport_mode: 'rail', status: 'delayed', current_location: 'Warsaw, Poland', departure_date: '2026-01-28', eta: '2026-02-18 12:00:00', tracking_updates: '[]' },
        { order_id: 1, supplier_id: 7, route: 'Dubai → Mumbai → Chennai', transport_mode: 'air', status: 'delivered', current_location: 'Chennai, India', departure_date: '2026-01-10', eta: '2026-01-12 09:00:00', tracking_updates: '[]' },
        { order_id: 2, supplier_id: 11, route: 'Mexico City → Houston → Dallas', transport_mode: 'road', status: 'in_transit', current_location: 'San Antonio, Texas', departure_date: '2026-02-06', eta: '2026-02-09 18:00:00', tracking_updates: '[]' }
    ];

    const shipmentStmt = db.prepare(`INSERT OR IGNORE INTO shipments (order_id, supplier_id, route, transport_mode, status, current_location, departure_date, eta, tracking_updates) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    shipments.forEach((s, idx) => {
        shipmentStmt.run(s.order_id, s.supplier_id, s.route, s.transport_mode, s.status, s.current_location, s.departure_date, s.eta, s.tracking_updates);
        console.log(`  ✓ Shipment ${idx + 1}: ${s.route}`);
    });
    shipmentStmt.finalize();

    // ========================================
    // 5. SEED DISRUPTIONS
    // ========================================
    console.log('\n⚠️ Creating disruptions...');

    const disruptions = [
        { type: 'port_congestion', title: 'Severe Congestion at Shanghai Port', severity: 'high', affected_routes: '["Shanghai → Los Angeles"]', affected_transport_modes: '["sea"]', impact_description: 'Vessel waiting time increased to 12 days due to labor shortages.', is_active: 1 }
    ];

    const disruptionStmt = db.prepare(`INSERT OR IGNORE INTO disruptions (type, title, severity, affected_routes, affected_transport_modes, impact_description, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)`);
    disruptions.forEach((d, idx) => {
        disruptionStmt.run(d.type, d.title, d.severity, d.affected_routes, d.affected_transport_modes, d.impact_description, d.is_active);
        console.log(`  ✓ ALERT: ${d.title}`);
    });
    disruptionStmt.finalize();

    console.log('\n✅ SEED COMPLETE!');
    console.log('\n🔐 TEST CREDENTIALS:');
    console.log('  Buyer:    buyer_acme / buyer123');
    console.log('  Supplier: supplier_techforge / supplier123');
    console.log('  Admin:    admin / admin123');
});

db.close();
