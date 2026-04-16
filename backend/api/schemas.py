from __future__ import annotations

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=2, examples=["Which zones have the highest demand?"])
    model_name: str = Field(default="RandomForest", examples=["RandomForest"])


class InsightCard(BaseModel):
    label: str
    value: str


class ChatResponse(BaseModel):
    answer: str
    intent: str
    source: str
    supporting_points: list[str] = Field(default_factory=list)
    insights: list[InsightCard] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Predictions
# ---------------------------------------------------------------------------
class PredictionSummary(BaseModel):
    zone_id: int
    zone_name: str
    model_name: str
    current_demand: int
    surge_multiplier: float
    trend: str
    forecast: list[dict]


class PredictionInputRequest(BaseModel):
    zone_id: int = Field(..., ge=1, description="Zone ID for prediction", examples=[3])
    hour: int = Field(..., ge=0, le=23, description="Hour of day (0-23)", examples=[18])
    day_of_week: int = Field(default=2, ge=0, le=6, description="0=Monday")
    month: int = Field(default=3, ge=1, le=12)
    weather: str = Field(default="Clear", examples=["Clear"])
    vehicle_type: str = Field(default="Cab", examples=["Cab"])
    temperature: float = Field(default=28.0)
    humidity: float = Field(default=65.0, ge=0, le=100)
    rain_mm: float = Field(default=0.0, ge=0)
    hourly_vehicle_count: int = Field(default=150, ge=0)


class PredictionInputResponse(BaseModel):
    zone_id: int
    zone_name: str
    model_name: str
    input_features: dict
    predicted_traffic_index: float
    predicted_demand: int
    surge_multiplier: float


# ---------------------------------------------------------------------------
# Pricing
# ---------------------------------------------------------------------------
class PricingRequest(BaseModel):
    zone_id: int = Field(..., ge=1, le=10, examples=[3])
    distance_km: float = Field(..., gt=0, examples=[8.5])
    hour: int | None = Field(default=None, ge=0, le=23)
    weather: str = Field(default="Clear", examples=["Rainy"])


class PricingResponse(BaseModel):
    zone_id: int
    zone_name: str
    distance_km: float
    base_fare: float
    surge_multiplier: float
    final_fare: float
    current_demand: int | None = None
    weather: str | None = None
    hour: int | None = None


# ---------------------------------------------------------------------------
# Zones
# ---------------------------------------------------------------------------
class ZoneSummary(BaseModel):
    zone_id: int
    zone_name: str
    latitude: float
    longitude: float
    cluster_id: int
    avg_demand: float
    current_demand: int | None = None
    surge_multiplier: float | None = None
    trend: str | None = None


class ZoneDetail(ZoneSummary):
    forecast: list[dict] = Field(default_factory=list)