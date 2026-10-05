from fastapi import APIRouter, HTTPException, Query
from typing import Any, Dict
from backend.app.services.regional_forecast_service import get_regional_confidence_data

router = APIRouter(prefix="/api/regional-confidence", tags=["regional"])

@router.get("", response_model=Dict[str, Any])
def get_regional_confidence(
    forecast_days: int = Query(10, description="Number of days to forecast (max 10)", ge=1, le=10)
):
    """
    Get aggregated daily bust probability and risk levels for all supported regions.
    """
    try:
        result = get_regional_confidence_data(forecast_days)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
