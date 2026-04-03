from __future__ import annotations

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Chat
# ---------------------------------------------------------------------------
class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=500)
    model_name: str = Field(default="RandomForest")


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


# ---------------------------------------------------------------------------
# Pricing
# ---------------------------------------------------------------------------
class PricingRequest(BaseModel):
    zone_id: int = Field(..., ge=1, le=10, description="Zone ID (1-10)")
    distance_km: float = Field(..., gt=0, description="Trip distance in kilometres")
    hour: int | None = Field(default=None, ge=0, le=23, description="Hour of day (0-23). Defaults to current hour.")
    weather: str = Field(default="Clear", description="Weather condition: Clear, Rainy, Cloudy")


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

