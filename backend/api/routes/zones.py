"""Zone intelligence routes — GET /zones, GET /zones/{zone_id}"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from backend.api.inference import get_zone_metadata, get_zone_by_id
from backend.api.repository import prediction_repository
from backend.api.schemas import ZoneSummary, ZoneDetail
from backend.auth.dependencies import get_current_user

router = APIRouter(prefix="/zones", tags=["zones"])


def _enrich_zone(zone: dict, predictions: list[dict]) -> dict:
    """Merge live prediction data into zone metadata."""
    zone_id = zone["zone_id"]
    # Find matching prediction doc (if any)
    pred = next((p for p in predictions if p.get("zone_id") == zone_id), None)

    return {
        "zone_id": zone_id,
        "zone_name": zone["zone_name"],
        "latitude": float(zone.get("latitude", zone.get("lat", 0))),
        "longitude": float(zone.get("longitude", zone.get("lon", 0))),
        "cluster_id": int(zone.get("cluster_id", 0)),
        "avg_demand": float(zone.get("avg_demand", zone.get("avg_daily_demand", 0))),
        "current_demand": pred["current_demand"] if pred else None,
        "surge_multiplier": pred["surge_multiplier"] if pred else None,
        "trend": pred["trend"] if pred else None,
        "forecast": pred.get("forecast", []) if pred else [],
    }


@router.get("", response_model=list[ZoneSummary])
def list_zones(
    _user: dict = Depends(get_current_user),
) -> list[ZoneSummary]:
    """Return all zones with live demand and surge data."""
    zones = get_zone_metadata()
    predictions, _ = prediction_repository.list_predictions()
    return [ZoneSummary(**_enrich_zone(z, predictions)) for z in zones]


@router.get("/{zone_id}", response_model=ZoneDetail)
def get_zone(
    zone_id: int,
    _user: dict = Depends(get_current_user),
) -> ZoneDetail:
    """Return a single zone with full forecast."""
    zone = get_zone_by_id(zone_id)
    if zone is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Zone {zone_id} not found",
        )
    predictions, _ = prediction_repository.list_predictions()
    return ZoneDetail(**_enrich_zone(zone, predictions))
