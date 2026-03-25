from __future__ import annotations

from typing import Any

from pymongo.errors import PyMongoError

from backend.api.data_seed import build_seed_predictions
from backend.api.database import prediction_store


class PredictionRepository:
    def __init__(self) -> None:
        self._fallback_cache = build_seed_predictions()

    def _seed_if_needed(self) -> str:
        if not prediction_store.is_available():
            return "fallback"

        collection = prediction_store.collection()
        if collection.count_documents({}) == 0:
            collection.insert_many(build_seed_predictions())
        return "mongodb"

    def list_predictions(self, model_name: str | None = None) -> tuple[list[dict[str, Any]], str]:
        source = "fallback"
        try:
            source = self._seed_if_needed()
            if source == "mongodb":
                query = {"model_name": model_name} if model_name else {}
                docs = list(
                    prediction_store.collection().find(
                        query,
                        {"_id": 0},
                    )
                )
                if docs:
                    return docs, source
        except PyMongoError:
            pass

        docs = self._fallback_cache
        if model_name:
            docs = [doc for doc in docs if doc["model_name"].lower() == model_name.lower()]
        return docs, source


prediction_repository = PredictionRepository()