import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_get_regional_confidence_success():
    """Test standard 10-day forecast processing for supported locations."""
    response = client.get("/api/regional-confidence?forecast_days=10")
    
    assert response.status_code == 200
    data = response.json()
    
    # 1. 10-day forecast horizon
    assert data["forecast_days"] == 10
    assert "model_version" in data
    
    # 2. Locations processed (expecting 10 supported locations)
    locations = data["locations"]
    assert len(locations) == 10
    
    # 3. Check specific location properties
    pune_data = next((loc for loc in locations if loc["location"] == "Pune"), None)
    assert pune_data is not None
    assert pune_data["status"] == "success"
    
    # 4. Expected daily aggregates (10 days means 10 daily objects)
    # The actual count might be 9 or 10 depending on the current time and timezone offset returned by Open-Meteo
    assert len(pune_data["daily"]) >= 9
    
    # 5. Check aggregation method (peak, average, risk_level)
    first_day = pune_data["daily"][0]
    assert "date" in first_day
    assert "peak_bust_probability" in first_day
    assert "average_bust_probability" in first_day
    assert "risk_level" in first_day
    
    assert first_day["risk_level"] in ["Low", "Medium", "High"]
    
def test_existing_api_compatibility():
    """Verify that existing APIs are unharmed."""
    # /api/geocode
    geo_res = client.get("/api/geocode?q=Mumbai")
    assert geo_res.status_code == 200
    
    # /api/reliability
    rel_res = client.get("/api/reliability?location_name=Mumbai")
    assert rel_res.status_code == 200
    
    # /api/predictions
    pred_res = client.get("/api/predictions?latitude=19.076&longitude=72.877&location_name=Mumbai")
    assert pred_res.status_code == 200
    pred_data = pred_res.json()
    assert "hourly_predictions" in pred_data
    assert len(pred_data["hourly_predictions"]) > 0
    # Should still default to 7 days (~168 hours) for backwards compatibility
    assert 160 < len(pred_data["hourly_predictions"]) <= 168

def test_regional_confidence_invalid_days():
    """Test input validation for forecast_days."""
    response = client.get("/api/regional-confidence?forecast_days=11")
    assert response.status_code == 422 # Validation error from FastAPI Query constraint
