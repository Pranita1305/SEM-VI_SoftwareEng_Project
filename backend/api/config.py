import os
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path


_BACKEND_DIR = Path(__file__).resolve().parent.parent  # …/backend


@dataclass
class Settings:
    mongodb_uri: str = os.getenv("SRDAPO_MONGODB_URI", "mongodb://127.0.0.1:27017")
    mongodb_db_name: str = os.getenv("SRDAPO_MONGODB_DB_NAME", "srdapo")
    predictions_collection: str = os.getenv("SRDAPO_PREDICTIONS_COLLECTION", "predictions")
    cors_origins: list[str] = field(
        default_factory=lambda: [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
    )
    # Path to the Databases/ folder that holds the CSV datasets
    data_dir: Path = _BACKEND_DIR / "Databases"
    # APScheduler: how often (in minutes) to refresh predictions
    scheduler_interval_minutes: int = int(
        os.getenv("SRDAPO_SCHEDULER_INTERVAL_MINUTES", "60")
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()