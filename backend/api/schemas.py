from __future__ import annotations

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=500)
    model_name: str = Field(default="LSTM")


class InsightCard(BaseModel):
    label: str
    value: str


class ChatResponse(BaseModel):
    answer: str
    intent: str
    source: str
    supporting_points: list[str] = Field(default_factory=list)
    insights: list[InsightCard] = Field(default_factory=list)


class PredictionSummary(BaseModel):
    zone_id: int
    zone_name: str
    model_name: str
    current_demand: int
    surge_multiplier: float
    trend: str
    forecast: list[dict]
