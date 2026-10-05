import logging
import requests
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
# Use a specific user agent to respect Nominatim usage policy
USER_AGENT = "MeghDrishti-WeatherPredictionApp/1.0"

def geocode_location(query: str) -> List[Dict[str, Any]]:
    if not query or not query.strip():
        raise ValueError("Search query cannot be empty.")

    params = {
        "q": query.strip(),
        "format": "json",
        "limit": 5
    }
    
    headers = {
        "User-Agent": USER_AGENT
    }

    try:
        response = requests.get(NOMINATIM_URL, params=params, headers=headers, timeout=10.0)
        response.raise_for_status()
    except requests.exceptions.Timeout:
        logger.error("Nominatim request timed out.")
        raise TimeoutError("Geocoding service request timed out.")
    except requests.exceptions.HTTPError as e:
        logger.error(f"Nominatim HTTP error: {e}")
        raise RuntimeError(f"Geocoding service HTTP error: {response.status_code}") from e
    except requests.exceptions.RequestException as e:
        logger.error(f"Nominatim network error: {e}")
        raise RuntimeError(f"Geocoding service network error: {e}") from e

    try:
        data = response.json()
    except ValueError as e:
        logger.error("Malformed JSON response from Nominatim.")
        raise ValueError("Geocoding service returned malformed JSON.") from e

    results = []
    for item in data:
        try:
            display_name = item.get("display_name", "")
            lat = float(item.get("lat"))
            lon = float(item.get("lon"))
            
            # Basic validation
            if not (-90.0 <= lat <= 90.0) or not (-180.0 <= lon <= 180.0):
                continue
                
            results.append({
                "display_name": display_name,
                "latitude": lat,
                "longitude": lon
            })
        except (TypeError, ValueError):
            # Skip invalid entries gracefully
            continue

    return results
