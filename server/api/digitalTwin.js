import express from 'express';
import { fetchGraph } from '../services/neo4jService.js';

const router = express.Router();

router.get('/digital-twin', async (req, res) => {
    try {
        const graph = await fetchGraph();
        res.json(graph);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
