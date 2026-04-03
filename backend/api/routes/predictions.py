from fastapi import APIRouter, Depends

from backend.api.repository import prediction_repository
from backend.api.schemas import PredictionSummary
from backend.auth.dependencies import get_current_user

router = APIRouter(prefix="/predictions", tags=["predictions"])


@router.get("", response_model=list[PredictionSummary])
def list_prediction_summaries(
    model_name: str = "RandomForest",
    _user: dict = Depends(get_current_user),
) -> list[PredictionSummary]:
    docs, _ = prediction_repository.list_predictions(model_name=model_name)
    return docs