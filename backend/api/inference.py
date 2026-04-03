"""
ML Inference Service
====================
Trains lightweight RandomForest models from the CSV datasets at import time
and exposes prediction helpers used by the API routes and scheduler.

Models trained:
  1. **Demand model** – predicts `ride_demand` from zone, time, weather features.
  2. **Traffic model** – predicts `traffic_index` from zone, time, weather features.

Both models are kept **in-memory** (no disk I/O needed at runtime).
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

from backend.api.config import get_settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Zone metadata (loaded once)
# ---------------------------------------------------------------------------
_ZONE_META: pd.DataFrame | None = None


def _load_zone_meta() -> pd.DataFrame:
    global _ZONE_META
    if _ZONE_META is not None:
        return _ZONE_META

    settings = get_settings()
    path = settings.data_dir / "zone_clusters_with_labels.csv"
    if not path.exists():
        path = settings.data_dir / "zone_clusters.csv"

    _ZONE_META = pd.read_csv(path)
    logger.info("Loaded zone metadata: %d zones from %s", len(_ZONE_META), path.name)
    return _ZONE_META


def get_zone_metadata() -> list[dict[str, Any]]:
    """Return zone metadata as a list of dicts."""
    return _load_zone_meta().to_dict(orient="records")


def get_zone_by_id(zone_id: int) -> dict[str, Any] | None:
    """Return a single zone's metadata by ID, or None."""
    df = _load_zone_meta()
    match = df[df["zone_id"] == zone_id]
    if match.empty:
        return None
    return match.iloc[0].to_dict()


# ---------------------------------------------------------------------------
# Feature engineering (shared)
# ---------------------------------------------------------------------------
def _add_datetime_features(frame: pd.DataFrame) -> pd.DataFrame:
    frame = frame.copy()
    frame["datetime"] = pd.to_datetime(frame["datetime"], errors="coerce")
    frame["hour"] = frame["datetime"].dt.hour
    frame["day_of_week"] = frame["datetime"].dt.dayofweek
    frame["month"] = frame["datetime"].dt.month
    frame = frame.drop(columns=["datetime"])
    return frame


# ---------------------------------------------------------------------------
# Demand model
# ---------------------------------------------------------------------------
_demand_pipeline: Pipeline | None = None
_DEMAND_FEATURES: list[str] = []


def _train_demand_model() -> Pipeline:
    settings = get_settings()
    csv_path = settings.data_dir / "ride_demand.csv"
    if not csv_path.exists():
        raise FileNotFoundError(f"ride_demand.csv not found at {csv_path}")

    df = pd.read_csv(csv_path).dropna(subset=["ride_demand"])
    df = _add_datetime_features(df)

    target = "ride_demand"
    features = df.drop(columns=[target])

    categorical = [c for c in ["zone_name", "vehicle_type", "weather"] if c in features.columns]
    numeric = [c for c in features.columns if c not in categorical]

    global _DEMAND_FEATURES
    _DEMAND_FEATURES = list(features.columns)

    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore"), categorical),
            ("num", "passthrough", numeric),
        ]
    )

    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("model", RandomForestRegressor(n_estimators=200, random_state=42, n_jobs=-1)),
    ])
    pipeline.fit(features, df[target])
    logger.info("Demand model trained on %d rows", len(df))
    return pipeline


def _get_demand_pipeline() -> Pipeline:
    global _demand_pipeline
    if _demand_pipeline is None:
        _demand_pipeline = _train_demand_model()
    return _demand_pipeline


# ---------------------------------------------------------------------------
# Traffic model
# ---------------------------------------------------------------------------
_traffic_pipeline: Pipeline | None = None
_TRAFFIC_FEATURES: list[str] = []


def _train_traffic_model() -> Pipeline:
    settings = get_settings()
    csv_path = settings.data_dir / "weather_traffic.csv"
    if not csv_path.exists():
        raise FileNotFoundError(f"weather_traffic.csv not found at {csv_path}")

    df = pd.read_csv(csv_path).dropna(subset=["traffic_index"])
    df = _add_datetime_features(df)

    target = "traffic_index"
    features = df.drop(columns=[target])

    categorical = [c for c in ["weather"] if c in features.columns]
    numeric = [c for c in features.columns if c not in categorical]

    global _TRAFFIC_FEATURES
    _TRAFFIC_FEATURES = list(features.columns)

    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore"), categorical),
            ("num", "passthrough", numeric),
        ]
    )

    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("model", RandomForestRegressor(n_estimators=150, random_state=42, n_jobs=-1)),
    ])
    pipeline.fit(features, df[target])
    logger.info("Traffic model trained on %d rows", len(df))
    return pipeline


def _get_traffic_pipeline() -> Pipeline:
    global _traffic_pipeline
    if _traffic_pipeline is None:
        _traffic_pipeline = _train_traffic_model()
    return _traffic_pipeline


# ---------------------------------------------------------------------------
# Public prediction API
# ---------------------------------------------------------------------------
_WEATHER_OPTIONS = ["Clear", "Rainy", "Cloudy"]
_VEHICLE_TYPES = ["Cab", "Auto", "Bike"]


def predict_demand(
    zone_id: int,
    zone_name: str,
    hour: int,
    day_of_week: int = 2,
    month: int = 3,
    weather: str = "Clear",
    vehicle_type: str = "Cab",
    temperature: float = 28.0,
    humidity: float = 65.0,
    traffic_index: float = 6.0,
    hourly_vehicle_count: int = 150,
) -> int:
    """Predict ride demand for a zone at a given time."""
    pipeline = _get_demand_pipeline()
    row = pd.DataFrame([{
        "zone_id": zone_id,
        "zone_name": zone_name,
        "vehicle_type": vehicle_type,
        "weather": weather,
        "temperature": temperature,
        "humidity": humidity,
        "traffic_index": traffic_index,
        "hourly_vehicle_count": hourly_vehicle_count,
        "hour": hour,
        "day_of_week": day_of_week,
        "month": month,
    }])
    # Keep only columns the model was trained on
    row = row[[c for c in _DEMAND_FEATURES if c in row.columns]]
    pred = pipeline.predict(row)[0]
    return max(0, int(round(pred)))


def predict_traffic(
    zone_id: int,
    hour: int,
    day_of_week: int = 2,
    month: int = 3,
    weather: str = "Clear",
    temperature: float = 28.0,
    rain_mm: float = 0.0,
    humidity: float = 65.0,
) -> float:
    """Predict traffic index for a zone at a given time."""
    pipeline = _get_traffic_pipeline()
    row = pd.DataFrame([{
        "zone_id": zone_id,
        "weather": weather,
        "temperature": temperature,
        "rain_mm": rain_mm,
        "humidity": humidity,
        "hour": hour,
        "day_of_week": day_of_week,
        "month": month,
    }])
    row = row[[c for c in _TRAFFIC_FEATURES if c in row.columns]]
    pred = pipeline.predict(row)[0]
    return round(float(max(0, pred)), 2)


def compute_surge(current_demand: int, avg_demand: float) -> float:
    """
    Compute a surge multiplier based on how far demand exceeds the average.

    Rules (inspired by real ride-hailing platforms):
      demand <= avg        → 1.0×
      avg < demand <= 1.3× → 1.2×
      1.3× < demand <= 1.6× → 1.5×
      1.6× < demand <= 2.0× → 1.8×
      demand > 2.0×        → 2.5×
    """
    if avg_demand <= 0:
        return 1.0
    ratio = current_demand / avg_demand
    if ratio <= 1.0:
        return 1.0
    elif ratio <= 1.3:
        return 1.2
    elif ratio <= 1.6:
        return 1.5
    elif ratio <= 2.0:
        return 1.8
    else:
        return 2.5


def classify_trend(surge: float) -> str:
    """Map surge multiplier to a human-readable trend label."""
    if surge <= 1.0:
        return "normal"
    elif surge <= 1.3:
        return "moderate"
    elif surge <= 1.6:
        return "high"
    else:
        return "critical"


def warm_up() -> None:
    """
    Pre-train both models eagerly (called at server startup).
    Subsequent calls are instant because the pipelines are cached.
    """
    logger.info("Warming up ML models …")
    _get_demand_pipeline()
    _get_traffic_pipeline()
    _load_zone_meta()
    logger.info("ML models ready.")
