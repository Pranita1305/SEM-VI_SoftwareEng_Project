@@ -3,56 +3,56 @@ from __future__ import annotations
import logging
from typing import Any

from pymongo.errors import PyMongoError

from backend.api.database import prediction_store

logger = logging.getLogger(__name__)


class PredictionRepository:
    """
    Serves prediction documents.

    Priority order:
      1. MongoDB (if available and populated)
      2. In-memory cache populated by the scheduler / inference service
    """

    def list_predictions(
        self, model_name: str | None = None
    ) -> tuple[list[dict[str, Any]], str]:
        # 1️⃣ Try MongoDB first
        try:
            if prediction_store.is_available():
                collection = prediction_store.collection()
                collection = prediction_store.predictions_collection()
                query: dict = {}
                if model_name:
                    query["model_name"] = model_name
                docs = list(collection.find(query, {"_id": 0}))
                if docs:
                    return docs, "mongodb"
        except PyMongoError:
            logger.debug("MongoDB read failed — using in-memory cache", exc_info=True)

        # 2️⃣ Fall back to scheduler cache
        from backend.api.scheduler import get_cached_predictions

        docs = get_cached_predictions()
        if model_name:
            docs = [d for d in docs if d.get("model_name", "").lower() == model_name.lower()]
        return docs, "cache"

    def update_predictions(self, docs: list[dict[str, Any]]) -> None:
        """Persist predictions to MongoDB (best-effort)."""
        try:
            if prediction_store.is_available():
                col = prediction_store.collection()
                col = prediction_store.predictions_collection()
                col.delete_many({})
                col.insert_many(docs)
                logger.info("Persisted %d prediction docs to MongoDB", len(docs))
        except PyMongoError:
            logger.warning("MongoDB write failed", exc_info=True)


prediction_repository = PredictionRepository()