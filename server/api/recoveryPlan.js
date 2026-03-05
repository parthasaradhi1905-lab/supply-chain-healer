import express from 'express';
import { getRecoveryPlan } from '../services/mlService.js';

const router = express.Router();

router.get('/recovery-plan', async (req, res) => {
    try {
        const plan = await getRecoveryPlan();
        res.json(plan);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
