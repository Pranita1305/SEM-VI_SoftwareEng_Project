import os
from dataclasses import dataclass, field
from functools import lru_cache


@dataclass
class Settings:
    mongodb_uri: str = os.getenv("SRDAPO_MONGODB_URI", "mongodb://127.0.0.1:27017")
    mongodb_db_name: str = os.getenv("SRDAPO_MONGODB_DB_NAME", "srdapo")
    predictions_collection: str = os.getenv("SRDAPO_PREDICTIONS_COLLECTION", "predictions")
    cors_origins: list[str] = field(
        default_factory=lambda: [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()