import driver from '../digitalTwin/Neo4jClient.js';

export async function fetchGraph() {
    const session = driver.session();
    try {
        const result = await session.run(
            `MATCH (a)-[r]->(b)
             RETURN a, r, b`
        );

        // Format response logically for a standard UI graph library (nodes and edges)
        const nodesSet = new Map();
        const edges = [];

        result.records.forEach(record => {
            const a = record.get('a');
            const r = record.get('r');
            const b = record.get('b');

            nodesSet.set(a.elementId, { id: a.elementId, labels: a.labels, properties: a.properties });
            nodesSet.set(b.elementId, { id: b.elementId, labels: b.labels, properties: b.properties });

            edges.push({
                id: r.elementId,
                type: r.type,
                source: a.elementId,
                target: b.elementId,
                properties: r.properties
            });
        });

        return {
            nodes: Array.from(nodesSet.values()),
            edges
        };
    } catch (err) {
        console.error("Error fetching Neo4j graph:", err);
        throw err;
    } finally {
        await session.close();
    }
}
