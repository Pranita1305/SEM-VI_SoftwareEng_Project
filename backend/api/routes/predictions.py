from fastapi import APIRouter

from backend.api.repository import prediction_repository
from backend.api.schemas import PredictionSummary

router = APIRouter(prefix="/predictions", tags=["predictions"])


@router.get("", response_model=list[PredictionSummary])
def list_prediction_summaries(model_name: str = "LSTM") -> list[PredictionSummary]:
    docs, _ = prediction_repository.list_predictions(model_name=model_name)
    return docs