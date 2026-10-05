from fastapi import APIRouter, HTTPException, Query
from typing import Any, Dict
from backend.app.services.geocoding_service import geocode_location

router = APIRouter(prefix="/api/geocode", tags=["geocode"])

@router.get("", response_model=Dict[str, Any])
def search_location(
    q: str = Query(..., description="Location search query", min_length=1)
):
    try:
        results = geocode_location(q)
        return {"results": results}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
