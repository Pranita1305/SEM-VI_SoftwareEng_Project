from __future__ import annotations

from pymongo import MongoClient
from pymongo import ASCENDING, MongoClient
from pymongo.collection import Collection
from pymongo.database import Database
from pymongo.errors import PyMongoError

from backend.api.config import get_settings


class MongoPredictionStore:
    def __init__(self) -> None:
    """MongoDB Data Access Layer for SRDAPO data stores."""

    def __init__(self, client: MongoClient | None = None) -> None:
        settings = get_settings()
        self._settings = settings
        self._client: MongoClient | None = None
        self._settings = get_settings()
        self._client: MongoClient | None = client

    def _connect(self) -> MongoClient:
        if self._client is None:
            self._client = MongoClient(self._settings.mongodb_uri, serverSelectionTimeoutMS=1500)
            self._client = MongoClient(
                self._settings.mongodb_uri,
                serverSelectionTimeoutMS=1500,
            )
        return self._client

    def database(self) -> Database:
        return self._connect()[self._settings.mongodb_db_name]

    def predictions_collection(self) -> Collection:
        return self.database()[self._settings.predictions_collection]

    # Backward-compatible alias
    def collection(self) -> Collection:
        client = self._connect()
        return client[self._settings.mongodb_db_name][self._settings.predictions_collection]
        return self.predictions_collection()

    def is_available(self) -> bool:
        try:
            self._connect().admin.command("ping")
            return True
        except PyMongoError:
            return False

    def ensure_database_objects(self) -> dict[str, object]:
        """
        Create required collections and indexes for the DAL.

        MongoDB is schemaless, so "tables" are represented by collections.
        """
        db = self.database()

        required_collections = {
            self._settings.predictions_collection,
            "users",
            "test_cases",
        }

        existing = set(db.list_collection_names())
        created_collections: list[str] = []
        for name in sorted(required_collections - existing):
            db.create_collection(name)
            created_collections.append(name)

        # Predictions lookups by model and zone are common.
        db[self._settings.predictions_collection].create_index(
            [("model_name", ASCENDING), ("zone_id", ASCENDING)],
            name="idx_model_zone",
        )

        # User emails must be unique for signup/login.
        db["users"].create_index(
            [("email", ASCENDING)],
            unique=True,
            name="uniq_email",
        )

        # Store test metadata by suite/type for quick reporting.
        db["test_cases"].create_index(
            [("suite", ASCENDING), ("type", ASCENDING)],
            name="idx_suite_type",
        )

        return {
            "database": self._settings.mongodb_db_name,
            "created_collections": created_collections,
            "ensured_collections": sorted(required_collections),
        }


prediction_store = MongoPredictionStore()
