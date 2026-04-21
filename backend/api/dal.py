"""
Data Access Layer (DAL) for SRDAPO
Provides abstraction between application logic and MongoDB database.
"""

import logging
from datetime import datetime
from typing import Optional, List, Dict, Any

try:
    from pymongo import MongoClient, ASCENDING, DESCENDING
    from pymongo.errors import PyMongoError, ConnectionFailure, ServerSelectionTimeoutError
    PYMONGO_AVAILABLE = True
except ImportError:
    PYMONGO_AVAILABLE = False

logger = logging.getLogger(__name__)

# --------------------------------------------------------------------------- #
#  In-memory cache (fallback when MongoDB is unavailable)
# --------------------------------------------------------------------------- #
_CACHE: List[Dict[str, Any]] = []


# --------------------------------------------------------------------------- #
#  MongoPredictionStore  –  low-level MongoDB helper
# --------------------------------------------------------------------------- #
class MongoPredictionStore:
    """
    Handles direct MongoDB operations: connection, collection management,
    index creation, CRUD on the predictions / users / test_cases collections.
    """

    REQUIRED_COLLECTIONS = ["predictions", "users", "test_cases"]

    def __init__(self, uri: str = "mongodb://localhost:27017", db_name: str = "srdapo"):
        self.uri = uri
        self.db_name = db_name
        self.client: Optional[MongoClient] = None
        self.db = None

    # ------------------------------------------------------------------ #
    #  Connection management
    # ------------------------------------------------------------------ #
    def connect(self) -> bool:
        """Open MongoDB connection. Returns True on success."""
        if not PYMONGO_AVAILABLE:
            logger.warning("pymongo not installed; running in cache-only mode.")
            return False
        try:
            self.client = MongoClient(self.uri, serverSelectionTimeoutMS=3000)
            self.client.admin.command("ping")          # force actual connection
            self.db = self.client[self.db_name]
            logger.info("Connected to MongoDB at %s / %s", self.uri, self.db_name)
            return True
        except (ConnectionFailure, ServerSelectionTimeoutError) as exc:
            logger.warning("MongoDB unavailable: %s", exc)
            self.client = None
            self.db = None
            return False

    def disconnect(self):
        """Close MongoDB connection."""
        if self.client:
            self.client.close()
            self.client = None
            self.db = None

    def is_connected(self) -> bool:
        return self.client is not None and self.db is not None

    # ------------------------------------------------------------------ #
    #  Schema initialisation (Part A – DAL core)
    # ------------------------------------------------------------------ #
    def ensure_database_objects(self) -> Dict[str, Any]:
        """
        Create missing collections and their required indexes.
        Idempotent – safe to run multiple times.

        Returns a dict with keys 'created_collections' and 'created_indexes'.
        """
        if not self.is_connected():
            raise RuntimeError("Not connected to MongoDB.")

        existing = self.db.list_collection_names()
        created_collections: List[str] = []
        created_indexes: List[str] = []

        for coll_name in self.REQUIRED_COLLECTIONS:
            if coll_name not in existing:
                self.db.create_collection(coll_name)
                created_collections.append(coll_name)
                logger.info("Created collection: %s", coll_name)

        # --- predictions indexes ---
        pred_coll = self.db["predictions"]
        idx = pred_coll.create_index(
            [("model_name", ASCENDING), ("zone_id", ASCENDING)],
            name="idx_model_zone",
            background=True,
        )
        created_indexes.append(idx)

        # --- users indexes ---
        user_coll = self.db["users"]
        idx = user_coll.create_index(
            [("email", ASCENDING)],
            name="uniq_email",
            unique=True,
            background=True,
        )
        created_indexes.append(idx)

        # --- test_cases indexes ---
        tc_coll = self.db["test_cases"]
        idx = tc_coll.create_index(
            [("suite", ASCENDING), ("type", ASCENDING)],
            name="idx_suite_type",
            background=True,
        )
        created_indexes.append(idx)

        return {
            "created_collections": created_collections,
            "created_indexes": created_indexes,
        }

    # ------------------------------------------------------------------ #
    #  Predictions CRUD
    # ------------------------------------------------------------------ #
    def insert_prediction(self, doc: Dict[str, Any]) -> str:
        """Insert a prediction document; returns the inserted _id as string."""
        doc.setdefault("created_at", datetime.utcnow())
        result = self.db["predictions"].insert_one(doc)
        return str(result.inserted_id)

    def find_predictions(
        self,
        model_name: Optional[str] = None,
        zone_id: Optional[int] = None,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """Query prediction documents with optional filters."""
        query: Dict[str, Any] = {}
        if model_name:
            query["model_name"] = model_name
        if zone_id is not None:
            query["zone_id"] = zone_id

        docs = list(
            self.db["predictions"]
            .find(query, {"_id": 0})
            .sort("created_at", DESCENDING)
            .limit(limit)
        )
        return docs

    # ------------------------------------------------------------------ #
    #  Users CRUD
    # ------------------------------------------------------------------ #
    def insert_user(self, doc: Dict[str, Any]) -> str:
        doc.setdefault("created_at", datetime.utcnow())
        result = self.db["users"].insert_one(doc)
        return str(result.inserted_id)

    def find_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        return self.db["users"].find_one({"email": email}, {"_id": 0})

    # ------------------------------------------------------------------ #
    #  Test-cases CRUD (for storing test results)
    # ------------------------------------------------------------------ #
    def insert_test_result(self, doc: Dict[str, Any]) -> str:
        doc.setdefault("run_at", datetime.utcnow())
        result = self.db["test_cases"].insert_one(doc)
        return str(result.inserted_id)


# --------------------------------------------------------------------------- #
#  PredictionRepository  –  high-level repository with cache fallback
# --------------------------------------------------------------------------- #
class PredictionRepository:
    """
    Repository pattern: wraps MongoPredictionStore and provides a
    graceful cache fallback when MongoDB is unavailable.
    """

    def __init__(self, store: Optional[MongoPredictionStore] = None):
        self.store = store or MongoPredictionStore()
        self._connected = False

    def initialise(self):
        """Connect and ensure schema objects exist."""
        self._connected = self.store.connect()
        if self._connected:
            self.store.ensure_database_objects()

    def teardown(self):
        """Disconnect from MongoDB."""
        self.store.disconnect()
        self._connected = False

    # ------------------------------------------------------------------ #
    #  list_predictions  –  the main read path (tested in WB-3/4/5)
    # ------------------------------------------------------------------ #
    def list_predictions(
        self,
        model_name: Optional[str] = None,
        zone_id: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        Return predictions from MongoDB when available, else fall back to
        the in-process cache.  Each document gets a 'source' key added.
        """
        try:
            if self._connected and self.store.is_connected():
                docs = self.store.find_predictions(model_name=model_name, zone_id=zone_id)
                for d in docs:
                    d["source"] = "mongodb"
                return docs
            else:
                return self._from_cache(model_name)
        except PyMongoError as exc:
            logger.error("MongoDB query failed, falling back to cache: %s", exc)
            return self._from_cache(model_name)

    def _from_cache(self, model_name: Optional[str] = None) -> List[Dict[str, Any]]:
        results = [
            {**d, "source": "cache"}
            for d in _CACHE
            if model_name is None or d.get("model_name") == model_name
        ]
        return results

    # ------------------------------------------------------------------ #
    #  write path  –  writes to both MongoDB and cache
    # ------------------------------------------------------------------ #
    def save_prediction(self, doc: Dict[str, Any]) -> Optional[str]:
        """Persist a prediction and mirror it into the in-memory cache."""
        _CACHE.append({**doc})          # always update cache
        if self._connected and self.store.is_connected():
            return self.store.insert_prediction(doc)
        return None


# --------------------------------------------------------------------------- #
#  Module-level singleton (used by FastAPI routers)
# --------------------------------------------------------------------------- #
prediction_repo = PredictionRepository()
