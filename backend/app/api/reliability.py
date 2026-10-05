from fastapi import APIRouter, Query
from typing import Dict, Any
from backend.app.services.reliability_service import get_reliability_metrics

router = APIRouter(prefix="/api/reliability", tags=["reliability"])

@router.get("", response_model=Dict[str, Any])
def get_reliability(
    location_name: str = Query(..., description="Name of the location to evaluate reliability")
):
    """
    Get the historical forecast reliability for a specific location.
    """
    return get_reliability_metrics(location_name)
