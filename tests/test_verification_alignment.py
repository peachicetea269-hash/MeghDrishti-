import json
import pytest
from datetime import datetime, timedelta
from unittest.mock import patch, mock_open, MagicMock

import sys
import os
# Add scripts directory to path to allow import
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "scripts")))

from prepare_verification_data import _parse_timestamp, fetch_historical_actuals, main

def test_parse_timestamp():
    # Should handle both with and without Z, and with/without seconds
    dt1 = _parse_timestamp("2026-10-05T12:00")
    assert dt1.year == 2026
    assert dt1.month == 10
    assert dt1.day == 5
    assert dt1.hour == 12
    
    dt2 = _parse_timestamp("2026-10-05T12:00:00Z")
    assert dt2.second == 0
    
    dt3 = _parse_timestamp("2026-10-05T12:00:30")
    assert dt3.second == 30

@patch("prepare_verification_data.requests.get")
def test_fetch_historical_actuals(mock_get):
    """Test actual fetching handles normal payloads and skips nulls."""
    mock_resp = MagicMock()
    mock_resp.json.return_value = {
        "hourly": {
            "time": ["2026-10-01T00:00", "2026-10-01T01:00", "2026-10-01T02:00"],
            "temperature_2m": [25.0, None, 26.0],
            "relative_humidity_2m": [50.0, 55.0, 50.0],
            "precipitation": [0.0, 0.0, 0.0],
            "wind_speed_10m": [10.0, 10.0, 10.0]
        }
    }
    mock_get.return_value = mock_resp
    
    actuals = fetch_historical_actuals(18.5, 73.8, "2026-10-01", "2026-10-01")
    
    # Should only return 2 valid hours because index 1 has None temperature
    assert len(actuals) == 2
    assert actuals[0]["timestamp"] == "2026-10-01T00:00"
    assert actuals[1]["timestamp"] == "2026-10-01T02:00"
    
@patch("prepare_verification_data.load_stored_forecasts")
@patch("prepare_verification_data.load_existing_historical_data")
@patch("prepare_verification_data.fetch_historical_actuals")
@patch("prepare_verification_data.os.makedirs")
@patch("builtins.open", new_callable=mock_open)
def test_main_alignment_flow(mock_file, mock_mkdirs, mock_fetch, mock_existing, mock_load):
    """Test full alignment logic with mocked data."""
    
    # Force 'current time' context to be far in future so our test records are 'eligible'
    # The script uses datetime.now(), we need to mock it or just provide very old records.
    # Let's provide very old records.
    
    mock_load.return_value = [
        {
            "location": "Pune",
            "latitude": 18.5,
            "longitude": 73.8,
            "forecast_timestamp": "2023-10-01T12:00:00Z",
            "generated_at": "2023-09-28T12:00:00Z", # 72 hours lead time
            "forecast": {"temperature": 30.5, "humidity": 65.0, "precipitation": 0.0, "wind_speed": 10.0},
            "bust_probability": 0.25,
            "risk_level": "Low",
            "model_version": "v1"
        },
        {
            # Future record - should be skipped
            "location": "Pune",
            "latitude": 18.5,
            "longitude": 73.8,
            "forecast_timestamp": "2050-10-01T12:00:00Z",
            "generated_at": "2050-09-28T12:00:00Z",
            "forecast": {"temperature": 30.5, "humidity": 65.0, "precipitation": 0.0, "wind_speed": 10.0}
        }
    ]
    
    mock_existing.return_value = {}
    
    mock_fetch.return_value = [
        {
            "timestamp": "2023-10-01T12:00",
            "actual": {"temperature": 32.0, "humidity": 60.0, "precipitation": 0.0, "wind_speed": 12.0}
        }
    ]
    
    main()
    
    # 1. Fetch should have been called once for Pune
    assert mock_fetch.call_count == 1
    args, kwargs = mock_fetch.call_args
    assert args[0] == 18.5 # lat
    assert args[1] == 73.8 # lon
    assert args[2] == "2023-10-01" # start date
    assert args[3] == "2023-10-01" # end date
    
    # 2. File should have been written with the single aligned record
    assert mock_file.call_count >= 1
    
    # Extract written JSON from the mocked file
    written_content = "".join(call.args[0] for call in mock_file().write.call_args_list)
    aligned_records = json.loads(written_content)
    
    assert len(aligned_records) == 1
    record = aligned_records[0]
    
    assert record["location"] == "Pune"
    assert record["forecast"]["temperature"] == 30.5
    assert record["actual"]["temperature"] == 32.0
    
    # Lead time check: 2023-10-01 - 2023-09-28 = 3 days = 72 hours
    assert record["lead_time_hours"] == 72.0
    
    # Schema check
    assert "bust_probability" in record
    assert "risk_level" in record

@patch("prepare_verification_data.load_stored_forecasts")
def test_main_empty_eligible(mock_load, caplog):
    """Test that zero eligible records logs cleanly without fetching/writing."""
    import logging
    caplog.set_level(logging.INFO)
    mock_load.return_value = [
        {
            "location": "Pune",
            "latitude": 18.5,
            "longitude": 73.8,
            "forecast_timestamp": "2050-10-01T12:00:00Z" # Future
        }
    ]
    
    main()
    assert "No valid historical forecast-vs-actual pairs are currently available." in caplog.text

