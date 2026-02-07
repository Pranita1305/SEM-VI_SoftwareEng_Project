#!/usr/bin/env python
"""Train a ride and traffic demand prediction model."""

from __future__ import annotations

import argparse
from pathlib import Path

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train ride demand model.")
    parser.add_argument(
        "--data",
        type=Path,
        required=True,
        help="Path to ride_demand.csv",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        required=True,
        help="Directory to write model artifacts.",
    )
    parser.add_argument(
        "--weather",
        type=str,
        default=None,
        help=(
            "Optional weather value to filter by. If omitted, the script uses the most "
            "frequent weather value (normal conditions)."
        ),
    )
    parser.add_argument("--random-state", type=int, default=42)
    return parser.parse_args()


def add_datetime_features(frame: pd.DataFrame) -> pd.DataFrame:
    frame = frame.copy()
    frame["datetime"] = pd.to_datetime(frame["datetime"], errors="coerce")
    frame["hour"] = frame["datetime"].dt.hour
    frame["day_of_week"] = frame["datetime"].dt.dayofweek
    frame["month"] = frame["datetime"].dt.month
    frame = frame.drop(columns=["datetime"])
    return frame


def main() -> None:
    args = parse_args()
    df = pd.read_csv(args.data)
    df = df.dropna(subset=["ride_demand"])

    weather_value = args.weather
    if weather_value is None and "weather" in df.columns:
        weather_value = df["weather"].mode().iat[0]

    if weather_value:
        df = df[df["weather"] == weather_value]
        print(f"Using weather filter: {weather_value} ({len(df)} rows)")

    df = add_datetime_features(df)

    target = "ride_demand"
    features = df.drop(columns=[target])

    categorical = ["zone_name", "vehicle_type", "weather"]
    numeric = [col for col in features.columns if col not in categorical]

    preprocessor = ColumnTransformer(
        transformers=[
            ("categorical", OneHotEncoder(handle_unknown="ignore"), categorical),
            ("numeric", "passthrough", numeric),
        ]
    )

    model = RandomForestRegressor(
        n_estimators=400,
        random_state=args.random_state,
        n_jobs=-1,
    )

    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("model", model),
        ]
    )

    X_train, X_test, y_train, y_test = train_test_split(
        features,
        df[target],
        test_size=0.2,
        random_state=args.random_state,
    )

    pipeline.fit(X_train, y_train)
    preds = pipeline.predict(X_test)

    mae = mean_absolute_error(y_test, preds)
    rmse = mean_squared_error(y_test, preds, squared=False)
    r2 = r2_score(y_test, preds)

    print(f"MAE: {mae:.4f}")
    print(f"RMSE: {rmse:.4f}")
    print(f"R2: {r2:.4f}")

    args.output_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, args.output_dir / "pipeline.joblib")


if __name__ == "__main__":
    main()
