import { driver } from './Neo4jClient.js';

const seedData = `
// 1. Ports
MERGE (singapore:Port {port_id: 'SGSIN'})
SET singapore.name = 'Singapore', singapore.lat = 1.25, singapore.lon = 103.75, singapore.congestion_level = 'LOW', singapore.queue_length = 0

MERGE (la:Port {port_id: 'USLAX'})
SET la.name = 'Los Angeles', la.lat = 33.74, la.lon = -118.26, la.congestion_level = 'LOW', la.queue_length = 0

MERGE (shanghai:Port {port_id: 'CNSHG'})
SET shanghai.name = 'Shanghai', shanghai.lat = 31.23, shanghai.lon = 121.47, shanghai.congestion_level = 'LOW', shanghai.queue_length = 0

// 2. Factories & Suppliers
MERGE (tsmc:Supplier {supplier_id: 'TSMC'})
SET tsmc.name = 'TSMC Taiwan', tsmc.reliability = 0.98, tsmc.capacity = 100000

MERGE (foxconn:Factory {factory_id: 'FOX_SH'})
SET foxconn.name = 'Foxconn Shanghai'

MERGE (tesla:Factory {factory_id: 'TSLA_SH'})
SET tesla.name = 'Tesla Gigafactory Shanghai'

// 3. Warehouses & Retailers
MERGE (whLA:Warehouse {warehouse_id: 'WH_LA_01'})
SET whLA.name = 'LA Central Distribution', whLA.inventory_level = 0.85

MERGE (apple:Retailer {retailer_id: 'AAPL'})
SET apple.name = 'Apple Retail'

// 4. Relationships (The Supply Chain Topology)
MERGE (tsmc)-[:SUPPLIES {transit_days: 2, cost: 500}]->(foxconn)
MERGE (tsmc)-[:SUPPLIES {transit_days: 3, cost: 700}]->(tesla)

MERGE (foxconn)-[:SHIPS_TO {transit_days: 14, cost: 4200}]->(shanghai)
MERGE (tesla)-[:SHIPS_TO {transit_days: 14, cost: 3800}]->(shanghai)

MERGE (shanghai)-[:ROUTE_TO {transit_days: 12}]->(singapore) // Hub route
MERGE (singapore)-[:ROUTE_TO {transit_days: 18}]->(la)
MERGE (shanghai)-[:ROUTE_TO {transit_days: 15}]->(la)

MERGE (la)-[:STORES {transit_days: 1}]->(whLA)
MERGE (whLA)-[:DELIVERS {transit_days: 2, cost: 150}]->(apple)
`;

export async function seedGraph() {
    const session = driver.session();
    try {
        console.log('[Neo4j] Seeding physical topology...');
        await session.run(seedData);
        console.log('[Neo4j] ✅ Topology seeded successfully.');
    } catch (err) {
        console.error('[Neo4j] ❌ Error seeding graph:', err.message);
    } finally {
        await session.close();
    }
}

// Allow running standalone
if (process.argv[1] && process.argv[1].endsWith('seedNeo4j.js')) {
    seedGraph().then(() => process.exit(0));
}
