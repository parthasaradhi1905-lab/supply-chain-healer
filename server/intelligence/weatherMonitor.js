import axios from 'axios';
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redis = new Redis();
const API_KEY = process.env.WEATHER_API_KEY;

// Major Supply Chain Nodes to Monitor
const NODES = [
    { name: "Shanghai", q: "Shanghai,CN", lat: 31.23, lng: 121.47 },
    { name: "Singapore", q: "Singapore,SG", lat: 1.35, lng: 103.82 },
    { name: "Rotterdam", q: "Rotterdam,NL", lat: 51.92, lng: 4.47 },
    { name: "Detroit", q: "Detroit,US", lat: 42.33, lng: -83.04 },
    { name: "Taiwan", q: "Taipei,TW", lat: 25.03, lng: 121.56 },
    { name: "Suez", q: "Suez,EG", lat: 29.96, lng: 32.52 }
];

class WeatherMonitor {
    constructor() {
        this.interval = null;
    }

    async fetchWeather(node) {
        try {
            const url = `https://api.openweathermap.org/data/2.5/weather?q=${node.q}&appid=${API_KEY}`;
            const res = await axios.get(url);
            return res.data;
        } catch (err) {
            console.error(`[Weather] Failed to fetch weather for ${node.name}:`, err.message);
            return null;
        }
    }

    detectRisk(weather) {
        if (!weather) return null;

        const wind = weather.wind?.speed || 0; // m/s
        const condition = weather.weather?.[0]?.main;
        const temp = weather.main?.temp - 273.15; // Celsius

        let riskFactor = 0;
        let reasons = [];

        // Wind Risk (> 20 m/s is roughly gale force)
        if (wind > 15) {
            riskFactor = Math.min(1, wind / 35);
            reasons.push(`High wind speeds (${wind}m/s)`);
        }

        // Extreme Conditions
        if (["Thunderstorm", "Snow", "Tornado", "Squall"].includes(condition)) {
            riskFactor = Math.max(riskFactor, 0.8);
            reasons.push(`Severe condition: ${condition}`);
        }

        // Extreme Temp (e.g. factory heatwaves or warehouse freezes)
        if (temp > 45 || temp < -15) {
            riskFactor = Math.max(riskFactor, 0.6);
            reasons.push(`Extreme temperature: ${temp.toFixed(1)}°C`);
        }

        if (riskFactor > 0.3) {
            return {
                node: weather.name,
                risk: parseFloat(riskFactor.toFixed(2)),
                condition,
                reasons,
                timestamp: new Date().toISOString()
            };
        }

        return null;
    }

    async start() {
        console.log("🌦  Weather Monitor Started...");

        // Initial Run
        await this.checkAllNodes();

        // Poll every 10 minutes
        this.interval = setInterval(() => {
            this.checkAllNodes();
        }, 10 * 60 * 1000);
    }

    async checkAllNodes() {
        console.log(`[Weather] Scanning ${NODES.length} Global Nodes...`);

        for (const node of NODES) {
            const data = await this.fetchWeather(node);
            const risk = this.detectRisk(data);

            if (risk) {
                console.log(`⚠️  [Weather Risk] ${node.name}: ${risk.risk * 100}% (${risk.condition})`);

                // Publish to Signal Stream for GNN consumption
                await redis.xadd(
                    "stream:signals",
                    "*",
                    "type", "weather",
                    "node", node.name,
                    "data", JSON.stringify(risk)
                );

                // Also publish for real-time UI/Globe
                await redis.publish("stream:disruptions", JSON.stringify({
                    type: "weather_anomaly",
                    location: node.name,
                    severity: risk.risk,
                    description: risk.reasons.join(", "),
                    timestamp: risk.timestamp
                }));
            }
        }
    }

    stop() {
        if (this.interval) clearInterval(this.interval);
    }
}

export default new WeatherMonitor();
