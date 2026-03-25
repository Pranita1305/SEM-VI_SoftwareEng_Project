from __future__ import annotations

from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.errors import PyMongoError

from backend.api.config import get_settings


class MongoPredictionStore:
    def __init__(self) -> None:
        settings = get_settings()
        self._settings = settings
        self._client: MongoClient | None = None

    def _connect(self) -> MongoClient:
        if self._client is None:
            self._client = MongoClient(self._settings.mongodb_uri, serverSelectionTimeoutMS=1500)
        return self._client

    def collection(self) -> Collection:
        client = self._connect()
        return client[self._settings.mongodb_db_name][self._settings.predictions_collection]

    def is_available(self) -> bool:
        try:
            self._connect().admin.command("ping")
            return True
        except PyMongoError:
            return False


prediction_store = MongoPredictionStore()
