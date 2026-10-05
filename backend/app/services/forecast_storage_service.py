import os
import json
import logging
from datetime import datetime
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

# Absolute path relative to the project root
_STORAGE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "forecast_history"))
_STORAGE_FILE = os.path.join(_STORAGE_DIR, "forecast_snapshots.jsonl")

def _get_storage_path() -> str:
    """Ensure directory exists and return the file path."""
    os.makedirs(_STORAGE_DIR, exist_ok=True)
    return _STORAGE_FILE

def save_forecast_snapshots(snapshots: List[Dict[str, Any]], override_path: str = None):
    """
    Persists forecast snapshots to a JSONL file.
    
    Duplicate Strategy:
    We use a hash set of (location, forecast_timestamp, model_version) from the EXISTING
    records in the file to quickly skip writing exact duplicates. If a record with the same
    location, target timestamp, and model version is already stored, we skip appending it,
    preventing infinite duplicate inflation on repeated dashboard loads.
    """
    if not snapshots:
        return

    try:
        path = override_path if override_path else _get_storage_path()
    except Exception as e:
        logger.error(f"Failed to resolve or create storage path: {e}")
        return

    
    existing_keys = set()
    
    # Pre-read existing keys to avoid duplicates
    if os.path.exists(path):
        try:
            with open(path, 'r', encoding='utf-8') as f:
                for line in f:
                    if not line.strip():
                        continue
                    try:
                        record = json.loads(line)
                        loc = record.get("location")
                        ts = record.get("forecast_timestamp") or record.get("timestamp")
                        mv = record.get("model_version")
                        if loc and ts and mv:
                            existing_keys.add(f"{loc}_{ts}_{mv}")
                    except json.JSONDecodeError:
                        pass
        except Exception as e:
            logger.warning(f"Failed to read existing snapshots for deduplication: {e}")

    # Append new records
    written = 0
    try:
        with open(path, 'a', encoding='utf-8') as f:
            for snapshot in snapshots:
                loc = snapshot.get("location")
                ts = snapshot.get("forecast_timestamp") or snapshot.get("timestamp")
                mv = snapshot.get("model_version")
                key = f"{loc}_{ts}_{mv}"
                
                if key not in existing_keys:
                    f.write(json.dumps(snapshot) + "\n")
                    existing_keys.add(key)
                    written += 1
                    
        if written > 0:
            logger.info(f"Persisted {written} new forecast snapshots.")
            
    except Exception as e:
        logger.error(f"Failed to write forecast snapshots to {path}: {e}")
        # We explicitly DO NOT raise the exception, as persistence is a side-effect
        # and should not crash the main prediction API flow.
