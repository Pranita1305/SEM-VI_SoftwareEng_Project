from fastapi import APIRouter, Depends
from fastapi import APIRouter, Depends, HTTPException, status

from backend.api.inference import compute_surge, get_zone_by_id, predict_demand, predict_traffic
from backend.api.repository import prediction_repository
from backend.api.schemas import PredictionSummary
from backend.api.schemas import (
    PredictionInputRequest,
    PredictionInputResponse,
    PredictionSummary,
)
from backend.auth.dependencies import get_current_user

router = APIRouter(prefix="/predictions", tags=["predictions"])


@router.get("", response_model=list[PredictionSummary])
def list_prediction_summaries(
    model_name: str = "RandomForest",
    _user: dict = Depends(get_current_user),
) -> list[PredictionSummary]:
    docs, _ = prediction_repository.list_predictions(model_name=model_name)
    return docs
    return docs


@router.post("/predict", response_model=PredictionInputResponse)
def predict_from_inputs(
    payload: PredictionInputRequest,
    _user: dict = Depends(get_current_user),
) -> PredictionInputResponse:
    zone = get_zone_by_id(payload.zone_id)
    if zone is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Zone {payload.zone_id} not found",
        )

    zone_name = str(zone.get("zone_name", f"Zone {payload.zone_id}"))
    avg_demand = float(zone.get("avg_demand", zone.get("avg_daily_demand", 0)))

    predicted_traffic_index = predict_traffic(
        zone_id=payload.zone_id,
        hour=payload.hour,
        day_of_week=payload.day_of_week,
        month=payload.month,
        weather=payload.weather,
        temperature=payload.temperature,
        rain_mm=payload.rain_mm,
        humidity=payload.humidity,
    )

    predicted_demand = predict_demand(
        zone_id=payload.zone_id,
        zone_name=zone_name,
        hour=payload.hour,
        day_of_week=payload.day_of_week,
        month=payload.month,
        weather=payload.weather,
        vehicle_type=payload.vehicle_type,
        temperature=payload.temperature,
        humidity=payload.humidity,
        traffic_index=predicted_traffic_index,
        hourly_vehicle_count=payload.hourly_vehicle_count,
    )
    surge_multiplier = compute_surge(predicted_demand, avg_demand)

    return PredictionInputResponse(
        zone_id=payload.zone_id,
        zone_name=zone_name,
        model_name="RandomForest",
        input_features=payload.model_dump(),
        predicted_traffic_index=predicted_traffic_index,
        predicted_demand=predicted_demand,
        surge_multiplier=surge_multiplier,
    )