import os
import json
import logging
import requests
from datetime import datetime
from collections import defaultdict
from typing import List, Dict, Any

# Ensure we import the updated verification schema
from backend.app.schemas.verification import VerificationRecord

logging.basicConfig(level=logging.INFO, format="%(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

ARCHIVE_API_URL = "https://archive-api.open-meteo.com/v1/archive"
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SNAPSHOTS_FILE = os.path.join(PROJECT_ROOT, "data", "forecast_history", "forecast_snapshots.jsonl")
VERIFICATION_DIR = os.path.join(PROJECT_ROOT, "data", "verification")
VERIFICATION_FILE = os.path.join(VERIFICATION_DIR, "historical_data.json")

def _parse_timestamp(ts_str: str) -> datetime:
    # "2026-10-05T12:00" or "2026-10-05T12:00:00Z"
    ts_str = ts_str.replace("Z", "")
    if len(ts_str) == 16: # "YYYY-MM-DDTHH:MM"
        return datetime.strptime(ts_str, "%Y-%m-%dT%H:%M")
    else: # "YYYY-MM-DDTHH:MM:SS"
        return datetime.strptime(ts_str, "%Y-%m-%dT%H:%M:%S")

def load_stored_forecasts() -> List[Dict[str, Any]]:
    if not os.path.exists(SNAPSHOTS_FILE):
        return []
        
    records = []
    with open(SNAPSHOTS_FILE, 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip():
                try:
                    records.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
    return records

def load_existing_historical_data() -> Dict[str, Any]:
    """Returns a dict mapping duplicate keys to avoid overwriting valid verification data."""
    if not os.path.exists(VERIFICATION_FILE):
        return {}
    try:
        with open(VERIFICATION_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return {f"{r['location']}_{r['timestamp']}_{r.get('model_version', 'unknown')}": r for r in data}
    except Exception:
        return {}

def fetch_historical_actuals(lat: float, lon: float, start_date: str, end_date: str) -> List[Dict[str, Any]]:
    """Fetches real historical/reanalysis data from Open-Meteo Archive API."""
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start_date,
        "end_date": end_date,
        "hourly": "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m",
        "timezone": "Asia/Kolkata"
    }
    try:
        response = requests.get(ARCHIVE_API_URL, params=params, timeout=15)
        response.raise_for_status()
        data = response.json()
        
        hourly = data.get("hourly", {})
        times = hourly.get("time", [])
        
        actuals = []
        for i in range(len(times)):
            t = hourly["temperature_2m"][i]
            h = hourly["relative_humidity_2m"][i]
            p = hourly["precipitation"][i]
            w = hourly["wind_speed_10m"][i]
            
            # Skip if API returns null for a timestamp (not yet available in archive)
            if t is None or h is None or p is None or w is None:
                continue
                
            actuals.append({
                "timestamp": times[i],
                "actual": {
                    "temperature": float(t),
                    "humidity": float(h),
                    "precipitation": float(p),
                    "wind_speed": float(w)
                }
            })
        return actuals
    except Exception as e:
        logger.error(f"Failed to fetch historical actuals for {lat}, {lon}: {e}")
        return []

def main():
    logger.info("Starting verification data alignment process...")
    
    forecasts = load_stored_forecasts()
    logger.info(f"Stored forecasts read: {len(forecasts)}")
    
    if not forecasts:
        logger.info("No stored forecasts found. Exiting.")
        return
        
    current_time = datetime.now()
    
    # 1. Group eligible forecasts by location
    eligible_by_location = defaultdict(list)
    for f in forecasts:
        ts_str = f.get("forecast_timestamp") or f.get("timestamp")
        if not ts_str:
            continue
            
        try:
            target_dt = _parse_timestamp(ts_str)
            # Only process if the target forecast date is fully in the past
            if target_dt.date() < current_time.date():
                f["_parsed_dt"] = target_dt
                eligible_by_location[f["location"]].append(f)
        except Exception as e:
            logger.debug(f"Skipping malformed record timestamp {ts_str}: {e}")
            
    total_eligible = sum(len(lst) for lst in eligible_by_location.values())
    logger.info(f"Eligible historical forecasts (target date < today): {total_eligible}")
    
    if total_eligible == 0:
        logger.info("No valid historical forecast-vs-actual pairs are currently available.")
        return
        
    # 2. Fetch actuals in bulk per location
    actual_timestamps_retrieved = 0
    successfully_aligned = 0
    skipped = 0
    invalid = 0
    
    existing_historical_map = load_existing_historical_data()
    
    for loc, records in eligible_by_location.items():
        # Get date ranges to fetch
        dates = [r["_parsed_dt"].date() for r in records]
        start_date = min(dates).strftime("%Y-%m-%d")
        end_date = max(dates).strftime("%Y-%m-%d")
        
        lat = records[0]["latitude"]
        lon = records[0]["longitude"]
        
        logger.info(f"Fetching actuals for {loc} from {start_date} to {end_date}...")
        actuals = fetch_historical_actuals(lat, lon, start_date, end_date)
        actual_timestamps_retrieved += len(actuals)
        
        # Build dictionary for O(1) matching by normalized string (e.g. "2026-10-04T12:00")
        actuals_map = {}
        for a in actuals:
            dt = _parse_timestamp(a["timestamp"])
            norm_str = dt.strftime("%Y-%m-%dT%H:%M")
            actuals_map[norm_str] = a["actual"]
            
        # 3. Match
        for r in records:
            norm_ts = r["_parsed_dt"].strftime("%Y-%m-%dT%H:%M")
            
            # Deduplication Check
            model_ver = r.get("model_version", "unknown")
            dup_key = f"{loc}_{norm_ts}_{model_ver}"
            if dup_key in existing_historical_map:
                # Already verified previously
                continue

            if norm_ts in actuals_map:
                # Calculate Lead Time
                lead_time = None
                gen_at_str = r.get("generated_at")
                if gen_at_str:
                    try:
                        gen_dt = _parse_timestamp(gen_at_str)
                        lead_time = (r["_parsed_dt"] - gen_dt).total_seconds() / 3600.0
                    except Exception:
                        pass
                
                raw_record = {
                    "location": loc,
                    "timestamp": norm_ts,
                    "forecast": r.get("forecast", {}),
                    "actual": actuals_map[norm_ts],
                    "generated_at": gen_at_str,
                    "forecast_timestamp": norm_ts,
                    "lead_time_hours": round(lead_time, 2) if lead_time is not None else None,
                    "bust_probability": r.get("bust_probability"),
                    "risk_level": r.get("risk_level"),
                    "model_version": model_ver
                }
                
                # Validation
                try:
                    valid_record = VerificationRecord(**raw_record)
                    existing_historical_map[dup_key] = valid_record.model_dump()
                    successfully_aligned += 1
                except Exception as e:
                    logger.warning(f"Invalid record alignment for {loc} at {norm_ts}: {e}")
                    invalid += 1
            else:
                # Archive API doesn't have this hour yet (or it failed)
                skipped += 1
                
    # 4. Save results
    if successfully_aligned > 0 or not os.path.exists(VERIFICATION_FILE) and existing_historical_map:
        os.makedirs(VERIFICATION_DIR, exist_ok=True)
        with open(VERIFICATION_FILE, 'w', encoding='utf-8') as f:
            json.dump(list(existing_historical_map.values()), f, indent=2)
            
    logger.info("=== Alignment Summary ===")
    logger.info(f"Stored forecasts: {len(forecasts)}")
    logger.info(f"Eligible historical forecasts: {total_eligible}")
    logger.info(f"Actual timestamps retrieved: {actual_timestamps_retrieved}")
    logger.info(f"Successfully aligned (new): {successfully_aligned}")
    logger.info(f"Skipped (missing actuals): {skipped}")
    logger.info(f"Invalid (schema failed): {invalid}")
    logger.info(f"Total Verification records saved: {len(existing_historical_map)}")
    logger.info(f"Output path: {VERIFICATION_FILE}")

if __name__ == "__main__":
    main()
