import OpenAI from 'openai';
import Redis from 'ioredis';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const redis = new Redis();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const NEWS_API_KEY = process.env.NEWS_API_KEY;

/**
 * Polls NewsAPI for supply chain events and pushes structured interpretations to Redis.
 */
export async function pollGlobalNews() {
    if (!NEWS_API_KEY || !process.env.OPENAI_API_KEY) {
        console.warn("[EventAnalyzer] Missing NEWS_API_KEY or OPENAI_API_KEY. News polling skipped.");
        return;
    }

    try {
        const query = "port strike OR supply chain disruption OR logistics delay OR factory shutdown";
        const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=3`;

        const response = await axios.get(url, {
            headers: { "X-Api-Key": NEWS_API_KEY }
        });

        const articles = response.data.articles || [];

        for (const article of articles) {
            // Check if we already processed this headline
            const exists = await redis.sismember("processed_news", article.title);
            if (!exists) {
                await extractAndPublishSignal(article.title, article.description);
                // Mark processed
                await redis.sadd("processed_news", article.title);
            }
        }
    } catch (err) {
        console.error("[EventAnalyzer] Failed to fetch news:", err.message);
    }
}

/**
 * Uses LLM to extract disruption features from raw text
 */
async function extractAndPublishSignal(headline, description) {
    try {
        const prompt = `Analyze this supply chain news headline and description. Extract the disruption signals.
        Return ONLY a JSON object with this exact structure:
        {
          "location": "City, Country or Region name",
          "risk_type": "port_strike|storm_disruption|supplier_failure|route_blockage|geopolitical",
          "severity": Float between 0 and 1,
          "time_horizon": "number of days e.g., '7 days'"
        }

        Headline: ${headline}
        Description: ${description}`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
        });

        const signal = JSON.parse(response.choices[0].message.content);

        console.log(`[EventAnalyzer] Extracted signal: ${signal.risk_type} at ${signal.location}`);

        // Push raw news signal to Feature Store buffer
        await redis.xadd(
            "stream:signals:news",
            "*",
            "node", signal.location,
            "risk_type", signal.risk_type,
            "severity", signal.severity.toString(),
            "time_horizon", signal.time_horizon
        );

    } catch (err) {
        console.error("[EventAnalyzer] GPT extraction failed:", err.message);
    }
}
