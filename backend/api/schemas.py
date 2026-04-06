@@ -14,66 +14,87 @@ class ChatRequest(BaseModel):
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
    zone_id: int = Field(..., ge=1, description="Zone ID for prediction")
    hour: int = Field(..., ge=0, le=23, description="Hour of day (0-23)")
    day_of_week: int = Field(default=2, ge=0, le=6, description="Day of week where 0=Monday")
    month: int = Field(default=3, ge=1, le=12, description="Month number (1-12)")
    weather: str = Field(default="Clear", description="Weather condition: Clear, Rainy, Cloudy")
    vehicle_type: str = Field(default="Cab", description="Vehicle type: Cab, Auto, Bike")
    temperature: float = Field(default=28.0, description="Temperature in Celsius")
    humidity: float = Field(default=65.0, ge=0, le=100, description="Humidity percentage")
    rain_mm: float = Field(default=0.0, ge=0, description="Rainfall in millimeters")
    hourly_vehicle_count: int = Field(default=150, ge=0, description="Vehicles available per hour")


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
