import { fetchPrediction } from './frontend/src/services/api.js';

async function runTests() {
  console.log("--- Testing Pune ---");
  try {
    const data = await fetchPrediction({ latitude: 18.5204, longitude: 73.8567, location_name: "Pune" });
    console.log(`Success! Received predictions for: ${data.location}`);
    console.log(`Peak Bust Probability: ${(data.summary.peak_bust_probability * 100).toFixed(1)}%`);
    console.log(`Overall Risk: ${data.summary.overall_risk_level}`);
  } catch (err) {
    console.error("Error for Pune:", err.message);
  }

  console.log("\n--- Testing Mumbai ---");
  try {
    const data = await fetchPrediction({ latitude: 19.0760, longitude: 72.8777, location_name: "Mumbai" });
    console.log(`Success! Received predictions for: ${data.location}`);
    console.log(`Peak Bust Probability: ${(data.summary.peak_bust_probability * 100).toFixed(1)}%`);
    console.log(`Overall Risk: ${data.summary.overall_risk_level}`);
  } catch (err) {
    console.error("Error for Mumbai:", err.message);
  }

  console.log("\n--- Testing Nashik ---");
  try {
    const data = await fetchPrediction({ latitude: 20.0059, longitude: 73.7797, location_name: "Nashik" });
    console.log(`Success! Received predictions for: ${data.location}`);
    console.log(`Peak Bust Probability: ${(data.summary.peak_bust_probability * 100).toFixed(1)}%`);
    console.log(`Overall Risk: ${data.summary.overall_risk_level}`);
  } catch (err) {
    console.error("Error for Nashik:", err.message);
  }

  console.log("\n--- Testing Errors ---");
  try {
    await fetchPrediction({ latitude: 100, longitude: 200, location_name: "Invalid" });
  } catch (err) {
    console.log("SUCCESS caught invalid coordinates:", err.message);
  }
}

runTests();
