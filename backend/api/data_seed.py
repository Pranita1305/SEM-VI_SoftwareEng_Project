from __future__ import annotations

from datetime import datetime, timedelta, timezone

BASE_ZONE_DATA = [
    {"zone_id": 1, "zone_name": "Koramangala", "current_demand": 120, "surge_multiplier": 1.5, "trend": "high"},
    {"zone_id": 2, "zone_name": "Indiranagar", "current_demand": 80, "surge_multiplier": 1.0, "trend": "normal"},
    {"zone_id": 3, "zone_name": "Sadashivanagar", "current_demand": 200, "surge_multiplier": 2.2, "trend": "critical"},
    {"zone_id": 4, "zone_name": "Jayanagar", "current_demand": 160, "surge_multiplier": 1.8, "trend": "high"},
    {"zone_id": 5, "zone_name": "Hebbal", "current_demand": 45, "surge_multiplier": 1.0, "trend": "normal"},
    {"zone_id": 6, "zone_name": "Whitefield", "current_demand": 95, "surge_multiplier": 1.3, "trend": "moderate"},
]

MODEL_MULTIPLIERS = {
    "SARIMA": [1.0, 1.16, 1.28, 1.24, 1.12],
    "XGBoost": [1.0, 1.12, 1.22, 1.26, 1.18],
    "LSTM": [1.0, 1.18, 1.34, 1.42, 1.30],
}


def build_seed_predictions() -> list[dict]:
    now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    documents: list[dict] = []
    for zone in BASE_ZONE_DATA:
        for model_name, multipliers in MODEL_MULTIPLIERS.items():
            forecast = []
            for hour_offset, multiplier in enumerate(multipliers):
                forecast.append(
                    {
                        "hour_offset": hour_offset,
                        "timestamp": now + timedelta(hours=hour_offset),
                        "predicted_demand": round(zone["current_demand"] * multiplier),
                    }
                )
            documents.append(
                {
                    **zone,
                    "model_name": model_name,
                    "generated_at": now,
                    "forecast": forecast,
                }
            )
    return documents