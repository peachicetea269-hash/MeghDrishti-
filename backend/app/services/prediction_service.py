import logging
from typing import Dict, Any

from backend.app.services.weather_service import get_hourly_weather
from ai.inference.predictor import predict_forecast_bust

logger = logging.getLogger(__name__)

def generate_forecast_risk(latitude: float, longitude: float, location_name: str) -> Dict[str, Any]:
    """
    Connects real Open-Meteo weather data to the ML model to generate hourly
    forecast bust predictions and a summarized risk profile.
    """
    # 1. Fetch real weather data
    try:
        hourly_weather_records = get_hourly_weather(latitude, longitude)
    except Exception as e:
        logger.error(f"Failed to fetch weather data: {e}")
        raise

    hourly_predictions = []
    peak_bust_probability = -1.0
    peak_probability_timestamp = None
    model_version_used = "unknown"

    # 2. Process each hourly record
    for record in hourly_weather_records:
        # Inject the location name required by the feature preparation layer
        record["location"] = location_name

        try:
            # Pass directly to existing predictor (which utilizes prepare_features + model.predict)
            prediction_result = predict_forecast_bust(record)
            
            # Extract fields
            prob = prediction_result["bust_probability"]
            pred = prediction_result["prediction"]
            model_version_used = prediction_result.get("model_version", "unknown")
            
            # Combine normalized weather with the prediction
            combined = {
                "timestamp": record["timestamp"],
                "prediction": pred,
                "bust_probability": prob,
                "model_version": model_version_used,
                "explanation": prediction_result.get("explanation"),
                "weather_data": {
                    "temperature": record["temperature"],
                    "humidity": record["humidity"],
                    "precipitation": record["precipitation"],
                    "pressure": record["pressure"],
                    "cloud_cover": record["cloud_cover"],
                    "wind_speed": record["wind_speed"],
                    "wind_direction": record["wind_direction"]
                }
            }
            hourly_predictions.append(combined)

            # Update peak statistics
            if prob > peak_bust_probability:
                peak_bust_probability = prob
                peak_probability_timestamp = record["timestamp"]
                
        except Exception as e:
            logger.warning(f"Failed to predict for timestamp {record.get('timestamp')}: {e}")
            continue

    if not hourly_predictions:
        raise RuntimeError("Failed to generate any hourly predictions from the provided weather data.")

    # 3. Overall Risk Classification
    if peak_bust_probability >= 0.7:
        overall_risk_level = "High"
    elif peak_bust_probability >= 0.4:
        overall_risk_level = "Medium"
    else:
        overall_risk_level = "Low"

    # 4. Extract Snapshots for Persistence (Verification-1)
    from datetime import datetime, timezone
    from backend.app.services.forecast_storage_service import save_forecast_snapshots
    
    generated_time = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    snapshots = []
    
    for hp in hourly_predictions:
        # Determine risk level per hour for the stored snapshot
        hr_prob = hp["bust_probability"]
        hr_risk = "High" if hr_prob >= 0.7 else "Medium" if hr_prob >= 0.4 else "Low"
        
        snapshot = {
            "location": location_name,
            "latitude": latitude,
            "longitude": longitude,
            "forecast_timestamp": hp["timestamp"],
            "timestamp": hp["timestamp"], # Backwards compatibility for prepare_verification_data.py
            "generated_at": generated_time,
            "forecast": hp["weather_data"],
            "bust_probability": hr_prob,
            "risk_level": hr_risk,
            "model_version": hp["model_version"]
        }
        snapshots.append(snapshot)
        
    # Side-effect: Persist to disk (failures are swallowed to protect the API)
    save_forecast_snapshots(snapshots)

    # 5. Return combined result
    return {
        "location": location_name,
        "latitude": latitude,
        "longitude": longitude,
        "summary": {
            "peak_bust_probability": peak_bust_probability,
            "peak_probability_timestamp": peak_probability_timestamp,
            "overall_risk_level": overall_risk_level,
            "model_version": model_version_used,
            "total_hourly_predictions": len(hourly_predictions)
        },
        "hourly_predictions": hourly_predictions
    }
