import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';

dotenv.config();

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'password';

console.log(`[Neo4j] Connecting to ${NEO4J_URI}...`);

const driver = neo4j.driver(
    NEO4J_URI,
    neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD),
    {
        maxConnectionPoolSize: 50,
        connectionTimeout: 20000,
        disableLosslessIntegers: true // Return standard JS numbers instead of Neo4j integer objects
    }
);

/**
 * Initialize Neo4j constraints and indexes
 * This prevents duplicate nodes when events are replayed or processed concurrently
 */
export async function initDb() {
    const session = driver.session();
    try {
        console.log('[Neo4j] Initializing constraints and indexes...');

        const constraints = [
            'CREATE CONSTRAINT ship_mmsi IF NOT EXISTS FOR (s:Ship) REQUIRE s.mmsi IS UNIQUE',
            'CREATE CONSTRAINT port_code IF NOT EXISTS FOR (p:Port) REQUIRE p.port_id IS UNIQUE',
            'CREATE CONSTRAINT supplier_id IF NOT EXISTS FOR (s:Supplier) REQUIRE s.supplier_id IS UNIQUE',
            'CREATE CONSTRAINT factory_id IF NOT EXISTS FOR (f:Factory) REQUIRE f.factory_id IS UNIQUE',
            'CREATE CONSTRAINT warehouse_id IF NOT EXISTS FOR (w:Warehouse) REQUIRE w.warehouse_id IS UNIQUE',
            'CREATE CONSTRAINT retailer_id IF NOT EXISTS FOR (r:Retailer) REQUIRE r.retailer_id IS UNIQUE',
            'CREATE CONSTRAINT disruption_id IF NOT EXISTS FOR (d:DisruptionEvent) REQUIRE d.id IS UNIQUE'
        ];

        for (const query of constraints) {
            await session.run(query);
        }

        console.log('[Neo4j] ✅ Constraints initialized successfully.');
    } catch (error) {
        console.error('[Neo4j] ❌ Error initializing constraints:', error.message);
    } finally {
        await session.close();
    }
}

export { driver };
export default driver;
