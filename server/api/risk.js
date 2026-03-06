import express from 'express';
import { getRiskPredictions } from '../services/mlService.js';

const router = express.Router();

router.get('/risk', async (req, res) => {
    try {
        const result = await getRiskPredictions();
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
