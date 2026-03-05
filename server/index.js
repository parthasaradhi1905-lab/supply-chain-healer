import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './api/routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// API Routes
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'Aegis Nexus Control Tower',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
    console.log('\n🚀 ================================');
    console.log('   AEGIS NEXUS CONTROL TOWER');
    console.log('   ================================');
    console.log(`   🌐 Server running on port ${PORT}`);
    console.log(`   📍 Local: http://localhost:${PORT}`);
    console.log(`   💚 Health: http://localhost:${PORT}/health`);
    console.log('   ================================\n');
});
