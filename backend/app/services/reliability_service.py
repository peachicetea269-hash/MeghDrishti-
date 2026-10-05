import logging
import json
import os
import math
from typing import Dict, Any, List
from backend.app.schemas.verification import VerificationRecord

logger = logging.getLogger(__name__)

VERIFICATION_DATA_PATH = os.path.join(os.path.dirname(__file__), "../../../../data/verification/historical_data.json")

def load_verification_data() -> List[VerificationRecord]:
    if not os.path.exists(VERIFICATION_DATA_PATH):
        return []
    
    try:
        with open(VERIFICATION_DATA_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if not isinstance(data, list):
                return []
            
            records = []
            for item in data:
                try:
                    records.append(VerificationRecord(**item))
                except Exception as e:
                    logger.warning(f"Skipping malformed verification record: {e}")
            return records
    except Exception as e:
        logger.error(f"Error loading verification data: {e}")
        return []

def calculate_mae(forecasts: List[float], actuals: List[float]) -> float:
    if not forecasts or len(forecasts) != len(actuals) or len(forecasts) == 0:
        return 0.0
    errors = [abs(f - a) for f, a in zip(forecasts, actuals)]
    return sum(errors) / len(errors)

def calculate_rmse(forecasts: List[float], actuals: List[float]) -> float:
    if not forecasts or len(forecasts) != len(actuals) or len(forecasts) == 0:
        return 0.0
    sq_errors = [(f - a) ** 2 for f, a in zip(forecasts, actuals)]
    return math.sqrt(sum(sq_errors) / len(sq_errors))

def get_reliability_metrics(location: str) -> Dict[str, Any]:
    records = load_verification_data()
    
    location_records = [r for r in records if r.location.lower() == location.lower()]
    
    if not location_records:
        return {
            "location": location,
            "status": "insufficient_data",
            "message": "Forecast reliability requires forecast-vs-actual verification data."
        }
        
    temp_f, temp_a = [], []
    hum_f, hum_a = [], []
    
    for r in location_records:
        if r.forecast.temperature is not None and r.actual.temperature is not None:
            temp_f.append(r.forecast.temperature)
            temp_a.append(r.actual.temperature)
            
        if r.forecast.humidity is not None and r.actual.humidity is not None:
            hum_f.append(r.forecast.humidity)
            hum_a.append(r.actual.humidity)

    if not temp_f and not hum_f:
        return {
            "location": location,
            "status": "insufficient_data",
            "message": "Forecast reliability requires forecast-vs-actual verification data."
        }

    metrics = {}
    if temp_f:
        metrics["temperature_mae"] = round(calculate_mae(temp_f, temp_a), 2)
        metrics["temperature_rmse"] = round(calculate_rmse(temp_f, temp_a), 2)
        metrics["samples"] = len(temp_f)
    if hum_f:
        metrics["humidity_mae"] = round(calculate_mae(hum_f, hum_a), 2)

    return {
        "location": location,
        "status": "calculated",
        "metrics": metrics
    }
