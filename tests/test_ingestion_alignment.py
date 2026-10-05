import pytest
import os
import json
from unittest.mock import patch, MagicMock
from scripts.prepare_verification_data import main

@pytest.fixture
def mock_env(tmp_path):
    snapshots_file = tmp_path / "forecast_snapshots.jsonl"
    verification_dir = tmp_path / "verification"
    verification_file = verification_dir / "historical_data.json"
    
    with patch("scripts.prepare_verification_data.SNAPSHOTS_FILE", str(snapshots_file)), \
         patch("scripts.prepare_verification_data.VERIFICATION_DIR", str(verification_dir)), \
         patch("scripts.prepare_verification_data.VERIFICATION_FILE", str(verification_file)):
        yield {
            "snapshots_file": snapshots_file,
            "verification_dir": verification_dir,
            "verification_file": verification_file
        }

@patch("scripts.prepare_verification_data.fetch_historical_actuals")
@patch("scripts.prepare_verification_data.datetime")
def test_preservation_existing_data(mock_dt, mock_fetch, mock_env):
    # TEST A: Existing data preserved
    # Set current time to future so "2023-01-01" is eligible if it were in snapshots
    mock_dt.now.return_value = MagicMock(date=lambda: MagicMock(__lt__=lambda other: False))
    # Actually we just need to ensure current time is > 2023-01-01. Let's return a specific datetime
    import datetime
    mock_dt.now.return_value = datetime.datetime(2026, 1, 1)
    
    # Create existing verification file with Record A
    mock_env["verification_dir"].mkdir()
    record_a = {
        "location": "Pune",
        "timestamp": "2023-01-01T12:00",
        "model_version": "v1",
        "forecast": {"temperature": 25.0},
        "actual": {"temperature": 27.0},
        "generated_at": "2023-01-01T00:00",
        "forecast_timestamp": "2023-01-01T12:00",
        "lead_time_hours": 12.0,
        "bust_probability": 0.5,
        "risk_level": "Medium"
    }
    with open(mock_env["verification_file"], "w") as f:
        json.dump([record_a], f)
        
    # No snapshots -> no new eligible records
    with open(mock_env["snapshots_file"], "w") as f:
        pass
        
    main()
    
    # Record A should still exist
    with open(mock_env["verification_file"], "r") as f:
        data = json.load(f)
    assert len(data) == 1
    assert data[0]["location"] == "Pune"

@patch("scripts.prepare_verification_data.fetch_historical_actuals")
@patch("scripts.prepare_verification_data.datetime")
def test_preservation_new_data_appended(mock_dt, mock_fetch, mock_env):
    # TEST B: Existing data + new data -> both exist
    import datetime
    mock_dt.now.return_value = datetime.datetime(2026, 1, 1)
    mock_dt.strptime.side_effect = datetime.datetime.strptime
    
    mock_env["verification_dir"].mkdir()
    record_a = {
        "location": "Pune",
        "timestamp": "2023-01-01T12:00",
        "model_version": "v1",
        "forecast": {"temperature": 25.0},
        "actual": {"temperature": 27.0},
        "generated_at": "2023-01-01T00:00",
        "forecast_timestamp": "2023-01-01T12:00",
        "lead_time_hours": 12.0,
        "bust_probability": 0.5,
        "risk_level": "Medium"
    }
    with open(mock_env["verification_file"], "w") as f:
        json.dump([record_a], f)
        
    # Snapshot contains Record B
    record_b_snap = {
        "location": "Mumbai",
        "forecast_timestamp": "2023-01-02T12:00",
        "timestamp": "2023-01-02T12:00",
        "latitude": 19.0,
        "longitude": 72.8,
        "model_version": "v1",
        "forecast": {"temperature": 30.0},
        "generated_at": "2023-01-02T00:00",
        "bust_probability": 0.2,
        "risk_level": "Low"
    }
    with open(mock_env["snapshots_file"], "w") as f:
        f.write(json.dumps(record_b_snap) + "\n")
        
    mock_fetch.return_value = [{
        "timestamp": "2023-01-02T12:00",
        "actual": {"temperature": 31.0, "humidity": 60, "precipitation": 0, "wind_speed": 10}
    }]
    
    main()
    
    with open(mock_env["verification_file"], "r") as f:
        data = json.load(f)
    assert len(data) == 2
    locations = set(r["location"] for r in data)
    assert locations == {"Pune", "Mumbai"}

@patch("scripts.prepare_verification_data.fetch_historical_actuals")
@patch("scripts.prepare_verification_data.datetime")
def test_duplicates_removed(mock_dt, mock_fetch, mock_env):
    # TEST C: Existing contains A, new snapshot contains A -> only one A
    import datetime
    mock_dt.now.return_value = datetime.datetime(2026, 1, 1)
    mock_dt.strptime.side_effect = datetime.datetime.strptime
    
    mock_env["verification_dir"].mkdir()
    record_a = {
        "location": "Pune",
        "timestamp": "2023-01-01T12:00",
        "model_version": "v1",
        "forecast": {"temperature": 25.0},
        "actual": {"temperature": 27.0},
        "generated_at": "2023-01-01T00:00",
        "forecast_timestamp": "2023-01-01T12:00",
        "lead_time_hours": 12.0,
        "bust_probability": 0.5,
        "risk_level": "Medium"
    }
    with open(mock_env["verification_file"], "w") as f:
        json.dump([record_a], f)
        
    record_a_snap = {
        "location": "Pune",
        "forecast_timestamp": "2023-01-01T12:00",
        "timestamp": "2023-01-01T12:00",
        "latitude": 18.5,
        "longitude": 73.8,
        "model_version": "v1",
        "forecast": {"temperature": 25.0},
        "generated_at": "2023-01-01T00:00",
        "bust_probability": 0.5,
        "risk_level": "Medium"
    }
    with open(mock_env["snapshots_file"], "w") as f:
        f.write(json.dumps(record_a_snap) + "\n")
        
    mock_fetch.return_value = [{
        "timestamp": "2023-01-01T12:00",
        "actual": {"temperature": 27.0, "humidity": 50, "precipitation": 0, "wind_speed": 5}
    }]
    
    main()
    
    with open(mock_env["verification_file"], "r") as f:
        data = json.load(f)
    assert len(data) == 1
    assert data[0]["location"] == "Pune"

@patch("scripts.prepare_verification_data.fetch_historical_actuals")
@patch("scripts.prepare_verification_data.datetime")
def test_no_file_and_no_records(mock_dt, mock_fetch, mock_env):
    # TEST D: No file + no new valid records -> no fake file created
    import datetime
    mock_dt.now.return_value = datetime.datetime(2026, 1, 1)
    
    # Snapshots exist but no valid pairs found because actuals are missing
    record_snap = {
        "location": "Pune",
        "forecast_timestamp": "2023-01-01T12:00",
        "timestamp": "2023-01-01T12:00",
        "latitude": 18.5,
        "longitude": 73.8,
        "model_version": "v1",
        "forecast": {"temperature": 25.0},
        "generated_at": "2023-01-01T00:00"
    }
    with open(mock_env["snapshots_file"], "w") as f:
        f.write(json.dumps(record_snap) + "\n")
        
    mock_fetch.return_value = [] # no actuals returned
    
    main()
    
    # File should not exist
    assert not os.path.exists(mock_env["verification_file"])

@patch("scripts.prepare_verification_data.fetch_historical_actuals")
@patch("scripts.prepare_verification_data.datetime")
def test_future_only_forecasts(mock_dt, mock_fetch, mock_env):
    # TEST E: Future-only forecasts -> no historical records
    import datetime
    # Current date is 2023-01-01
    mock_dt.now.return_value = datetime.datetime(2023, 1, 1)
    mock_dt.strptime.side_effect = datetime.datetime.strptime
    
    # Snapshot contains only future forecasts
    record_snap = {
        "location": "Pune",
        "forecast_timestamp": "2023-01-02T12:00",
        "timestamp": "2023-01-02T12:00",
        "latitude": 18.5,
        "longitude": 73.8,
        "model_version": "v1",
        "forecast": {"temperature": 25.0},
        "generated_at": "2023-01-01T00:00"
    }
    with open(mock_env["snapshots_file"], "w") as f:
        f.write(json.dumps(record_snap) + "\n")
        
    main()
    
    assert not os.path.exists(mock_env["verification_file"])
    # mock_fetch should not have been called because it's a future forecast
    mock_fetch.assert_not_called()
