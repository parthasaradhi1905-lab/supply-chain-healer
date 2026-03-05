import axios from 'axios';

const ML_API_URL = process.env.ML_API_URL || "http://localhost:5001";

export async function getRiskPredictions() {
    try {
        const response = await axios.get(`${ML_API_URL}/risk`);
        return response.data;
    } catch (err) {
        console.error("Error fetching risk from ML service:", err.message);
        throw new Error("Failed to fetch risk predictions from ML engine");
    }
}

export async function getRecoveryPlan() {
    try {
        const response = await axios.get(`${ML_API_URL}/recovery-plan`);
        return response.data;
    } catch (err) {
        console.error("Error fetching recovery plan from ML service:", err.message);
        throw new Error("Failed to fetch recovery plan from ML engine");
    }
}
