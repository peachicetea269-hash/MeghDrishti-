import logging
import requests
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

def get_hourly_weather(latitude: float, longitude: float, forecast_days: int = 7) -> List[Dict[str, Any]]:
    """
    Fetches hourly weather forecast from Open-Meteo and normalizes it.
    """
    if not isinstance(latitude, (int, float)) or not isinstance(longitude, (int, float)):
        raise ValueError("Latitude and longitude must be numbers.")
    if not (-90.0 <= latitude <= 90.0):
        raise ValueError("Latitude must be between -90 and 90.")
    if not (-180.0 <= longitude <= 180.0):
        raise ValueError("Longitude must be between -180 and 180.")

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": "temperature_2m,relative_humidity_2m,precipitation,pressure_msl,cloud_cover,wind_speed_10m,wind_direction_10m",
        "timezone": "Asia/Kolkata",
        "forecast_days": forecast_days
    }

    try:
        response = requests.get(OPEN_METEO_URL, params=params, timeout=10.0)
        response.raise_for_status()
    except requests.exceptions.Timeout:
        logger.error("Open-Meteo request timed out.")
        raise TimeoutError("Weather service request timed out.")
    except requests.exceptions.HTTPError as e:
        logger.error(f"Open-Meteo HTTP error: {e}")
        raise RuntimeError(f"Weather service HTTP error: {response.status_code}") from e
    except requests.exceptions.RequestException as e:
        logger.error(f"Open-Meteo network error: {e}")
        raise RuntimeError(f"Weather service network error: {e}") from e

    try:
        data = response.json()
    except ValueError as e:
        logger.error("Malformed JSON response from Open-Meteo.")
        raise ValueError("Weather service returned malformed JSON.") from e

    if "hourly" not in data:
        raise ValueError("Missing 'hourly' data in weather service response.")

    hourly = data["hourly"]
    required_fields = [
        "time", "temperature_2m", "relative_humidity_2m", 
        "precipitation", "pressure_msl", "cloud_cover", 
        "wind_speed_10m", "wind_direction_10m"
    ]
    
    for field in required_fields:
        if field not in hourly:
            raise ValueError(f"Missing required weather field in response: {field}")

    # Normalize into a list of dictionaries
    num_hours = len(hourly["time"])
    normalized_data = []

    for i in range(num_hours):
        try:
            # Skip if any value is missing (Open-Meteo sometimes returns None for future hours)
            if any(hourly[field][i] is None for field in required_fields if field != "time"):
                continue
                
            normalized_entry = {
                "timestamp": hourly["time"][i],
                "temperature": float(hourly["temperature_2m"][i]),
                "humidity": float(hourly["relative_humidity_2m"][i]),
                "precipitation": float(hourly["precipitation"][i]),
                "pressure": float(hourly["pressure_msl"][i]),
                "cloud_cover": float(hourly["cloud_cover"][i]),
                "wind_speed": float(hourly["wind_speed_10m"][i]),
                "wind_direction": float(hourly["wind_direction_10m"][i])
            }
            normalized_data.append(normalized_entry)
        except (TypeError, ValueError) as e:
            raise ValueError(f"Invalid data type in weather response at index {i}: {e}")

    if not normalized_data:
        raise ValueError("Weather service returned empty hourly data.")

    return normalized_data
