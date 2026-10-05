from pydantic import BaseModel, Field
from typing import Optional

class WeatherMetrics(BaseModel):
    temperature: Optional[float] = Field(None, description="Temperature in Celsius")
    humidity: Optional[float] = Field(None, description="Relative humidity percentage")
    precipitation: Optional[float] = Field(None, description="Precipitation in mm")
    wind_speed: Optional[float] = Field(None, description="Wind speed in km/h")

class VerificationRecord(BaseModel):
    location: str = Field(..., description="Location name (e.g., Pune)")
    timestamp: str = Field(..., description="ISO 8601 Timestamp")
    forecast: WeatherMetrics = Field(..., description="Forecasted weather metrics")
    actual: WeatherMetrics = Field(..., description="Actual observed weather metrics")
    
    # Extra Verification Metadata
    generated_at: Optional[str] = None
    forecast_timestamp: Optional[str] = None
    lead_time_hours: Optional[float] = None
    bust_probability: Optional[float] = None
    risk_level: Optional[str] = None
    model_version: Optional[str] = None
