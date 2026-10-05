import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
import requests

client = TestClient(app)

@pytest.mark.parametrize("name,lat,lon", [
    ('Pune', 18.5204, 73.8567),
    ('Mumbai', 19.0760, 72.8777),
    ('Nashik', 20.0059, 73.7797)
])
def test_api(name, lat, lon):
    response = client.get(f'/api/predictions?latitude={lat}&longitude={lon}&location_name={name}')
    assert response.status_code == 200
    data = response.json()
    assert data['location'] == name
    assert 'summary' in data
    assert 'hourly_predictions' in data
    assert len(data['hourly_predictions']) > 0

def test_api_invalid_latitude():
    res = client.get('/api/predictions?latitude=100.0&longitude=73.8567&location_name=Pune')
    assert res.status_code == 422

def test_api_missing_parameter():
    res = client.get('/api/predictions?latitude=18.5204&longitude=73.8567')
    assert res.status_code == 422

def test_api_invalid_longitude():
    res = client.get('/api/predictions?latitude=18.5204&longitude=abc&location_name=Pune')
    assert res.status_code == 422

def test_api_weather_service_failure(monkeypatch):
    class MockResponse:
        def __init__(self): self.status_code = 500
        def raise_for_status(self): raise requests.exceptions.HTTPError('Error 500')
    
    monkeypatch.setattr(requests, 'get', lambda *args, **kwargs: MockResponse())
    res = client.get('/api/predictions?latitude=18.5204&longitude=73.8567&location_name=Pune')
    assert res.status_code == 500
