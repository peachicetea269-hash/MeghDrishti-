import pytest
import requests
from backend.app.services.prediction_service import generate_forecast_risk

@pytest.mark.parametrize("name,lat,lon", [
    ('Pune', 18.5204, 73.8567),
    ('Mumbai', 19.0760, 72.8777),
    ('Nashik', 20.0059, 73.7797)
])
def test_city(name, lat, lon):
    result = generate_forecast_risk(lat, lon, name)
    summary = result['summary']
    hourly = result['hourly_predictions']
    
    assert summary['total_hourly_predictions'] > 0
    assert 0.0 <= summary['peak_bust_probability'] <= 1.0
    assert 'overall_risk_level' in summary
    assert 'model_version' in summary
    
    all_valid_prob = all(0.0 <= h['bust_probability'] <= 1.0 for h in hourly)
    assert all_valid_prob
    assert len(hourly) > 0
    assert 'weather_data' in hourly[0]

def test_invalid_coords():
    with pytest.raises(Exception):
        generate_forecast_risk('invalid', 73.8567, 'Pune')

def test_network_failure(monkeypatch):
    class MockResponse:
        def __init__(self, status_code, json_data=None):
            self.status_code = status_code
            self.json_data = json_data
        def raise_for_status(self):
            if self.status_code >= 400:
                raise requests.exceptions.HTTPError(f'Error {self.status_code}')
        def json(self):
            if self.json_data is not None:
                return self.json_data
            raise ValueError('Malformed JSON')

    monkeypatch.setattr(requests, 'get', lambda *args, **kwargs: MockResponse(500))
    with pytest.raises(Exception):
        generate_forecast_risk(18.5204, 73.8567, 'Pune')

def test_malformed_json(monkeypatch):
    class MockResponse:
        def __init__(self, status_code, json_data=None):
            self.status_code = status_code
            self.json_data = json_data
        def raise_for_status(self):
            pass
        def json(self):
            raise ValueError('Malformed JSON')

    monkeypatch.setattr(requests, 'get', lambda *args, **kwargs: MockResponse(200))
    with pytest.raises(Exception):
        generate_forecast_risk(18.5204, 73.8567, 'Pune')

def test_empty_response(monkeypatch):
    class MockResponse:
        def __init__(self, status_code, json_data=None):
            self.status_code = status_code
            self.json_data = json_data
        def raise_for_status(self):
            pass
        def json(self):
            return self.json_data

    monkeypatch.setattr(requests, 'get', lambda *args, **kwargs: MockResponse(200, json_data={'hourly': {'time': []}}))
    with pytest.raises(Exception):
        generate_forecast_risk(18.5204, 73.8567, 'Pune')
