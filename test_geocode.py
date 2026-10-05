import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

@pytest.mark.parametrize("query", [
    "Pune",
    "Mumbai",
    "Nashik",
    "Nagpur",
    "fjdkslajfklsajdklfjsalkdf"
])
def test_geocode(query):
    res = client.get(f"/api/geocode?q={query}")
    assert res.status_code == 200
    data = res.json()
    assert "results" in data
    
    # We don't strictly assert length > 0 because gibberish should return empty
    if data["results"]:
        first = data["results"][0]
        assert "display_name" in first
        assert "latitude" in first
        assert "longitude" in first
