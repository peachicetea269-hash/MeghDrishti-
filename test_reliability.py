import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

@pytest.mark.parametrize("loc", [
    "Pune",
    "Invalid",
    ""
])
def test_rel(loc):
    res = client.get(f"/api/reliability?location_name={loc}")
    # In case of invalid, our app returns either 200 with an empty history or insufficient_data status, or 422 if location is empty maybe
    # We just ensure it doesn't crash (500)
    assert res.status_code in [200, 422, 404, 400]
    
    if res.status_code == 200:
        data = res.json()
        assert "status" in data
