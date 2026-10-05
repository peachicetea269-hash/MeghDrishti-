import os
import json
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_empty_dataset(tmp_path, monkeypatch):
    monkeypatch.setattr('backend.app.services.reliability_service.VERIFICATION_DATA_PATH', str(tmp_path / 'empty.json'))
    res = client.get("/api/reliability?location_name=Pune")
    assert res.status_code == 200
    assert res.json()["status"] == "insufficient_data"

def test_valid_records(tmp_path, monkeypatch):
    data = [
        {
            "location": "Pune",
            "timestamp": "2023-01-01T12:00:00Z",
            "forecast": {"temperature": 30.0, "humidity": 50.0},
            "actual": {"temperature": 32.0, "humidity": 45.0}
        },
        {
            "location": "Pune",
            "timestamp": "2023-01-02T12:00:00Z",
            "forecast": {"temperature": 31.0, "humidity": 55.0},
            "actual": {"temperature": 31.0, "humidity": 55.0}
        },
        {
            "location": "Mumbai",
            "timestamp": "2023-01-02T12:00:00Z",
            "forecast": {"temperature": 30.0},
            "actual": {"temperature": 30.0}
        }
    ]
    path = tmp_path / 'test.json'
    with open(path, 'w') as f:
        json.dump(data, f)
    
    monkeypatch.setattr('backend.app.services.reliability_service.VERIFICATION_DATA_PATH', str(path))
    
    # Pune tests
    res = client.get("/api/reliability?location_name=Pune")
    assert res.status_code == 200
    assert res.json()["status"] == "calculated"
    metrics = res.json()["metrics"]
    assert metrics["temperature_mae"] == 1.0  # (|30-32| + |31-31|) / 2 = 1.0
    assert metrics["humidity_mae"] == 2.5
    assert metrics["samples"] == 2
    
    # Mumbai tests
    res = client.get("/api/reliability?location_name=Mumbai")
    assert res.status_code == 200
    assert res.json()["metrics"]["samples"] == 1

def test_missing_values(tmp_path, monkeypatch):
    data = [
        {
            "location": "Pune",
            "timestamp": "invalid-time",
            "forecast": {"temperature": 30.0, "humidity": None},
            "actual": {"temperature": None, "humidity": 45.0}
        }
    ]
    path = tmp_path / 'test2.json'
    with open(path, 'w') as f:
        json.dump(data, f)
    
    monkeypatch.setattr('backend.app.services.reliability_service.VERIFICATION_DATA_PATH', str(path))
    res = client.get("/api/reliability?location_name=Pune")
    assert res.status_code == 200
    # Because both records lack complete matching forecast/actual metrics
    assert res.json()["status"] == "insufficient_data"

def test_invalid_numeric_values(tmp_path, monkeypatch):
    data = [
        {
            "location": "Pune",
            "timestamp": "2023-01-01T12:00:00Z",
            "forecast": {"temperature": "not-a-number"},
            "actual": {"temperature": 32.0}
        }
    ]
    path = tmp_path / 'test3.json'
    with open(path, 'w') as f:
        json.dump(data, f)
    
    monkeypatch.setattr('backend.app.services.reliability_service.VERIFICATION_DATA_PATH', str(path))
    res = client.get("/api/reliability?location_name=Pune")
    assert res.status_code == 200
    # Pydantic fails validation on 'not-a-number', skipping the record entirely
    assert res.json()["status"] == "insufficient_data"

