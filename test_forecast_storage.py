import os
import json
import tempfile
from backend.app.services.forecast_storage_service import save_forecast_snapshots
from unittest.mock import patch

def test_save_forecast_snapshots():
    """Test saving forecast snapshots successfully stores unique records and respects duplicate strategy."""
    
    with tempfile.NamedTemporaryFile(mode='w+', delete=False, suffix=".jsonl") as tmp_file:
        tmp_path = tmp_file.name

    try:
        # Mock records
        snapshot_1 = {
            "location": "Pune",
            "latitude": 18.5204,
            "longitude": 73.8567,
            "forecast_timestamp": "2026-10-05T12:00:00",
            "timestamp": "2026-10-05T12:00:00",
            "generated_at": "2026-10-04T12:00:00Z",
            "forecast": {"temperature": 30.5},
            "bust_probability": 0.72,
            "risk_level": "High",
            "model_version": "v1"
        }
        
        snapshot_2 = {
            "location": "Mumbai",
            "latitude": 19.0760,
            "longitude": 72.8777,
            "forecast_timestamp": "2026-10-05T13:00:00",
            "timestamp": "2026-10-05T13:00:00",
            "generated_at": "2026-10-04T12:00:00Z",
            "forecast": {"temperature": 32.0},
            "bust_probability": 0.40,
            "risk_level": "Medium",
            "model_version": "v1"
        }

        # 1. First save
        save_forecast_snapshots([snapshot_1, snapshot_2], override_path=tmp_path)
        
        # Read back
        with open(tmp_path, 'r', encoding='utf-8') as f:
            lines = [json.loads(line) for line in f if line.strip()]
        
        assert len(lines) == 2
        assert lines[0]["location"] == "Pune"
        assert lines[1]["location"] == "Mumbai"
        
        # 2. Duplicate handling (trying to save snapshot_1 again)
        # Should be completely skipped
        save_forecast_snapshots([snapshot_1], override_path=tmp_path)
        
        with open(tmp_path, 'r', encoding='utf-8') as f:
            lines_after = [json.loads(line) for line in f if line.strip()]
            
        assert len(lines_after) == 2 # Count should not increase
        
        # 3. New forecast timestamp for same location
        snapshot_1_new_time = snapshot_1.copy()
        snapshot_1_new_time["forecast_timestamp"] = "2026-10-06T12:00:00"
        
        save_forecast_snapshots([snapshot_1_new_time], override_path=tmp_path)
        
        with open(tmp_path, 'r', encoding='utf-8') as f:
            lines_final = [json.loads(line) for line in f if line.strip()]
            
        assert len(lines_final) == 3 # Successfully added
        
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

def test_save_forecast_snapshots_swallows_errors():
    """Ensure that the side-effect service does not crash the caller if it fails."""
    # Pass an invalid directory as path to force OSError
    try:
        save_forecast_snapshots([{"location": "Pune"}], override_path="/invalid/dir/that/does/not/exist/file.jsonl")
        # If no exception raised, test passes
    except Exception as e:
        assert False, f"Exception should have been swallowed, but got: {e}"
