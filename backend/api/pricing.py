"""
Dynamic Pricing Engine
======================
Calculates ride fares using a base-fare formula derived from the trip_fares.csv
dataset patterns, multiplied by the live surge factor from the ML models.

Formula:
    base_fare = BASE_FIXED + (distance_km × PER_KM_RATE)
    final_fare = base_fare × surge_multiplier
"""

from __future__ import annotations

from backend.api.inference import predict_demand, compute_surge, get_zone_by_id


# Fare constants (derived from trip_fares.csv: mean base_fare ≈ 30 + 12/km)
BASE_FIXED: float = 30.0
PER_KM_RATE: float = 12.0


def estimate_fare(
    zone_id: int,
    distance_km: float,
    hour: int | None = None,
    weather: str = "Clear",
) -> dict:
    """
    Return a fare estimate dict with base_fare, surge_multiplier, and final_fare.

    If `hour` is None, uses a default midday (12) hour.
    """
    import datetime as _dt

    if hour is None:
        hour = _dt.datetime.now().hour

    zone = get_zone_by_id(zone_id)
    if zone is None:
        # Unknown zone — return base fare with no surge
        base = round(BASE_FIXED + distance_km * PER_KM_RATE, 2)
        return {
            "zone_id": zone_id,
            "zone_name": "Unknown",
            "distance_km": round(distance_km, 2),
            "base_fare": base,
            "surge_multiplier": 1.0,
            "final_fare": base,
        }

    zone_name = zone.get("zone_name", "Unknown")
    avg_demand = float(zone.get("avg_demand", zone.get("avg_daily_demand", 100)))
    # Average daily demand → rough hourly average (÷ 24)
    avg_hourly = avg_demand / 24.0

    current_demand = predict_demand(
        zone_id=zone_id,
        zone_name=zone_name,
        hour=hour,
        weather=weather,
    )
    surge = compute_surge(current_demand, avg_hourly)

    base = round(BASE_FIXED + distance_km * PER_KM_RATE, 2)
    final = round(base * surge, 2)

    return {
        "zone_id": zone_id,
        "zone_name": zone_name,
        "distance_km": round(distance_km, 2),
        "base_fare": base,
        "surge_multiplier": surge,
        "final_fare": final,
        "current_demand": current_demand,
        "weather": weather,
        "hour": hour,
    }
