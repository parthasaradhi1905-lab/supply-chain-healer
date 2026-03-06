import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import Redis from 'ioredis';
import apiRoutes from './api/routes.js';
import digitalTwinRoutes from './api/digitalTwin.js';
import riskRoutes from './api/risk.js';
import recoveryPlanRoutes from './api/recoveryPlan.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// WebSocket Server on Port 8080
const wss = new WebSocketServer({ port: 8080 });
console.log("WebSocket server running on 8080");

const subscriber = new Redis();
subscriber.subscribe("stream:risk.predictions", "stream:shipments", "stream:disruptions", "stream:risk_radar", "stream:shipments:live", "stream:storms");
subscriber.on("message", (channel, message) => {
    try {
        const data = JSON.parse(message);
        wss.clients.forEach(client => {
            // ws.OPEN is 1
            if (client.readyState === 1) {
                client.send(JSON.stringify({ type: channel, payload: data }));
            }
        });
    } catch (err) {
        console.error("Error broadcasting risk message:", err);
    }
});

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
app.use('/api', digitalTwinRoutes);
app.use('/api', riskRoutes);
app.use('/api', recoveryPlanRoutes);

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

    // Start disruption pipeline cron
    import('./disruptionPipeline/cron.js')
        .then(({ startCron }) => {
            startCron();
            console.log('   📡 Disruption pipeline scheduler started');
        })
        .catch(err => {
            console.log('   ⚠️  Pipeline scheduler skipped:', err.message);
        });

    // Start logistics continuous movement simulation
    import('./simulator/logisticsEngine.js').then(({ startSimulation }) => {
        startSimulation();
        console.log('   🚢 Logistics Movement Engine started');
    }).catch(err => console.error("Failed to load LogisticsEngine:", err));


    // Start Phase 6 Predictive Intelligence Pipeline
    import('./intelligence/featureStore.js').then(({ FeatureStore }) => {
        FeatureStore.startLoop();
        console.log('   📊 FeatureStore buffer loop started');
    }).catch(err => console.error("Failed to load FeatureStore:", err));

    import('./intelligence/riskRadar.js').then(({ default: RiskRadar }) => {
        RiskRadar.startRadar();
        console.log('   🌐 Global Risk Radar started');
    }).catch(err => console.error("Failed to load RiskRadar:", err));

    import('./intelligence/aisStreamTracker.js').then(({ startAISTracker }) => {
        startAISTracker();
    }).catch(err => console.error("Failed to load AISTracker:", err));

    import('./intelligence/eventAnalyzer.js').then(({ pollGlobalNews }) => {
        setInterval(pollGlobalNews, 300000); // Poll every 5 mins
        pollGlobalNews(); // Trigger immediately
    }).catch(err => console.error("Failed to load EventAnalyzer:", err));

    import('./intelligence/weatherMonitor.js').then(({ default: weatherMonitor }) => {
        weatherMonitor.start();
    }).catch(err => console.error("Failed to load WeatherMonitor:", err));

    import('./intelligence/stormTracker.js').then(({ default: stormTracker }) => {
        stormTracker.start();
    }).catch(err => console.error("Failed to load StormTracker:", err));

    // Initialize MemoryBus (Redis optional)
    import('./swarm/MemoryBus.js')
        .then(({ initRedis }) => {
            initRedis().then(() => {
                console.log('   🧠 MemoryBus initialized');

                // Start Sentinel Node
                import('./ai/agents/SentinelAgent.js').then(({ default: sentinel }) => {
                    sentinel.startListening();
                });

                // Start Neo4j Context & Twin Updater
                import('./digitalTwin/Neo4jClient.js').then(({ initDb }) => {
                    initDb().then(() => {
                        import('./digitalTwin/seedNeo4j.js').then(({ seedGraph }) => {
                            seedGraph().then(() => {
                                import('./digitalTwin/twin_updater.js').then(({ default: twinUpdater }) => {
                                    twinUpdater.start();
                                });
                                // Start Risk Listener
                                import('./swarm/RiskListener.js').then(({ default: riskListener }) => {
                                    riskListener.start();
                                });
                            });
                        });
                    });
                }).catch(err => {
                    console.error('   ⚠️ Neo4j init skipped:', err.message);
                });
            });
        })
        .catch(err => {
            console.log('   ⚠️  MemoryBus init skipped:', err.message);
        });
});
