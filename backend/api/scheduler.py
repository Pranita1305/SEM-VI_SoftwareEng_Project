"""
APScheduler — Automated Prediction Refresh
===========================================
Runs every N minutes (default 60) and rebuilds zone-level prediction
documents using the trained ML models, then pushes them to MongoDB
(or updates the in-memory fallback cache).
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from backend.api.inference import (
    compute_surge,
    classify_trend,
    get_zone_metadata,
    predict_demand,
    predict_traffic,
)

logger = logging.getLogger(__name__)

# In-memory cache that the repository can read when MongoDB is unavailable.
_latest_predictions: list[dict] = []


def get_cached_predictions() -> list[dict]:
    """Return the most recently generated predictions (may be empty on first boot)."""
    return _latest_predictions


def refresh_predictions() -> list[dict]:
    """
    Generate fresh predictions for every zone × {next 5 hours} and store them.

    Called by APScheduler on a cron/interval trigger, and also once at startup.
    """
    global _latest_predictions

    now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    zones = get_zone_metadata()

    documents: list[dict] = []
    for zone in zones:
        zone_id = int(zone["zone_id"])
        zone_name = str(zone["zone_name"])
        avg_demand = float(zone.get("avg_demand", zone.get("avg_daily_demand", 100)))
        avg_hourly = avg_demand / 24.0

        forecast: list[dict] = []
        for h_offset in range(5):
            future_hour = (now.hour + h_offset) % 24
            demand = predict_demand(
                zone_id=zone_id,
                zone_name=zone_name,
                hour=future_hour,
                day_of_week=now.weekday(),
                month=now.month,
            )
            traffic = predict_traffic(
                zone_id=zone_id,
                hour=future_hour,
                day_of_week=now.weekday(),
                month=now.month,
            )
            forecast.append({
                "hour_offset": h_offset,
                "timestamp": (now + timedelta(hours=h_offset)).isoformat(),
                "predicted_demand": demand,
                "predicted_traffic": round(traffic, 2),
            })

        current_demand = forecast[0]["predicted_demand"]
        surge = compute_surge(current_demand, avg_hourly)
        trend = classify_trend(surge)

        documents.append({
            "zone_id": zone_id,
            "zone_name": zone_name,
            "model_name": "RandomForest",
            "current_demand": current_demand,
            "surge_multiplier": surge,
            "trend": trend,
            "forecast": forecast,
            "generated_at": now.isoformat(),
        })

    _latest_predictions = documents

    # Attempt to persist into MongoDB (best-effort)
    try:
        from backend.api.database import prediction_store

        if prediction_store.is_available():
            col = prediction_store.collection()
            col.delete_many({})
            col.insert_many(documents)
            logger.info("Predictions persisted to MongoDB (%d docs)", len(documents))
        else:
            logger.info("MongoDB unavailable — using in-memory cache (%d docs)", len(documents))
    except Exception:
        logger.warning("MongoDB write failed — using in-memory cache", exc_info=True)

    return documents
