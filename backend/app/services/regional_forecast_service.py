import logging
from typing import Dict, Any, List
from datetime import datetime
from collections import defaultdict

from backend.app.services.weather_service import get_hourly_weather
from ai.inference.predictor import predict_forecast_bust
from ai.inference.model_loader import get_model

logger = logging.getLogger(__name__)

# Standard coordinates for the 10 locations encoded in the model
SUPPORTED_REGIONS = [
    {"name": "Pune", "lat": 18.5204, "lon": 73.8567},
    {"name": "Mumbai", "lat": 19.0760, "lon": 72.8777},
    {"name": "Nashik", "lat": 20.0059, "lon": 73.7797},
    {"name": "Nagpur", "lat": 21.1498, "lon": 79.0820},
    {"name": "Kolhapur", "lat": 16.7049, "lon": 74.2432},
    {"name": "Nanded", "lat": 19.1382, "lon": 77.3209},
    {"name": "Chhatrapati Sambhajinagar", "lat": 19.8761, "lon": 75.3433},
    {"name": "Amravati", "lat": 20.9320, "lon": 77.7522},
    {"name": "Ratnagiri", "lat": 16.9902, "lon": 73.3119},
    {"name": "Solapur", "lat": 17.6599, "lon": 75.9063},
]

def _assign_risk_level(prob: float) -> str:
    """Application-level risk thresholds."""
    if prob >= 0.70:
        return "High"
    if prob >= 0.40:
        return "Medium"
    return "Low"

def get_regional_confidence_data(forecast_days: int = 10) -> Dict[str, Any]:
    """
    Retrieves and predicts weather for all supported regions up to N days,
    aggregating hourly predictions into daily summaries for the regional map.
    """
    
    # Pre-fetch model to ensure it's loaded before processing loops
    model_data = get_model()
    model_version = model_data.get('version', 'unknown')
    
    locations_data = []

    for region in SUPPORTED_REGIONS:
        loc_name = region["name"]
        lat = region["lat"]
        lon = region["lon"]
        
        try:
            # 1. Fetch 10-day hourly weather for this location
            hourly_weather = get_hourly_weather(lat, lon, forecast_days=forecast_days)
            
            # 2. Predict and group by day (YYYY-MM-DD)
            daily_probs = defaultdict(list)
            
            from datetime import datetime, timezone
            from backend.app.services.forecast_storage_service import save_forecast_snapshots
            
            generated_time = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
            snapshots_for_storage = []
            
            for record in hourly_weather:
                # Inject location string required by feature prep layer
                record["location"] = loc_name
                
                try:
                    prediction_result = predict_forecast_bust(record)
                    prob = prediction_result["bust_probability"]
                    
                    # Extract date string "YYYY-MM-DD" from timestamp "YYYY-MM-DDTHH:MM"
                    date_str = record["timestamp"].split("T")[0]
                    daily_probs[date_str].append(prob)
                    
                    # Verification-1: Prepare snapshot
                    hr_risk = "High" if prob >= 0.7 else "Medium" if prob >= 0.4 else "Low"
                    snapshot = {
                        "location": loc_name,
                        "latitude": lat,
                        "longitude": lon,
                        "forecast_timestamp": record["timestamp"],
                        "timestamp": record["timestamp"],
                        "generated_at": generated_time,
                        "forecast": {
                            "temperature": record.get("temperature"),
                            "humidity": record.get("humidity"),
                            "precipitation": record.get("precipitation"),
                            "pressure": record.get("pressure"),
                            "cloud_cover": record.get("cloud_cover"),
                            "wind_speed": record.get("wind_speed"),
                            "wind_direction": record.get("wind_direction")
                        },
                        "bust_probability": prob,
                        "risk_level": hr_risk,
                        "model_version": model_version
                    }
                    snapshots_for_storage.append(snapshot)
                    
                except Exception as pred_err:
                    logger.debug(f"Prediction failed for {loc_name} at {record.get('timestamp')}: {pred_err}")
                    continue
            
            # Persist regional snapshots
            save_forecast_snapshots(snapshots_for_storage)
            
            # 3. Aggregate daily values
            daily_aggregates = []
            for date_str, probs in sorted(daily_probs.items()):
                if not probs:
                    continue
                peak_prob = max(probs)
                avg_prob = sum(probs) / len(probs)
                
                daily_aggregates.append({
                    "date": date_str,
                    "peak_bust_probability": round(peak_prob, 4),
                    "average_bust_probability": round(avg_prob, 4),
                    "risk_level": _assign_risk_level(peak_prob)
                })
                
            locations_data.append({
                "location": loc_name,
                "latitude": lat,
                "longitude": lon,
                "daily": daily_aggregates,
                "status": "success"
            })
            
        except Exception as e:
            logger.error(f"Failed to process regional forecast for {loc_name}: {e}")
            locations_data.append({
                "location": loc_name,
                "latitude": lat,
                "longitude": lon,
                "daily": [],
                "status": "error",
                "error": str(e)
            })

    return {
        "forecast_days": forecast_days,
        "model_version": model_version,
        "locations": locations_data
    }
