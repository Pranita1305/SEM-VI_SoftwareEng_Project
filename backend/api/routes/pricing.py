"""Pricing route — POST /pricing/estimate"""

from fastapi import APIRouter, Depends

from backend.api.pricing import estimate_fare
from backend.api.schemas import PricingRequest, PricingResponse
from backend.auth.dependencies import get_current_user

router = APIRouter(prefix="/pricing", tags=["pricing"])


@router.post("/estimate", response_model=PricingResponse)
def estimate_price(
    payload: PricingRequest,
    _user: dict = Depends(get_current_user),
) -> PricingResponse:
    """Return a dynamic fare estimate for a trip starting in the given zone."""
    result = estimate_fare(
        zone_id=payload.zone_id,
        distance_km=payload.distance_km,
        hour=payload.hour,
        weather=payload.weather,
    )
    return PricingResponse(**result)
