from fastapi import APIRouter, HTTPException, Query
from typing import Any, Dict
from backend.app.services.prediction_service import generate_forecast_risk

router = APIRouter(prefix="/api/predictions", tags=["predictions"])

@router.get("", response_model=Dict[str, Any])
def get_predictions(
    latitude: float = Query(..., description="Latitude of the location", ge=-90.0, le=90.0),
    longitude: float = Query(..., description="Longitude of the location", ge=-180.0, le=180.0),
    location_name: str = Query(..., description="Name of the location", min_length=1)
):
    """
    Get weather predictions and bust probability for a specific location.
    """
    try:
        result = generate_forecast_risk(latitude, longitude, location_name)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
