"""
test_dal.py  –  Assignment 8 Part B: White Box + Black Box Tests

White Box (WB-1 … WB-5) test internal DAL logic.
Black Box (BB-1, BB-2)  test the FastAPI /predictions endpoint behaviour.

Run:
    python -m unittest discover -s backend/tests -p "test_*.py"
or:
    python -m pytest backend/tests/test_dal.py -v
"""

import sys
import os
import unittest
from unittest.mock import MagicMock, patch, PropertyMock

# ── path fix so we can import from the project root ────────────────────────
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))

from backend.api.dal import (
    MongoPredictionStore,
    PredictionRepository,
    _CACHE,
)

# ── FastAPI test client ─────────────────────────────────────────────────────
try:
    from fastapi.testclient import TestClient
    from backend.api.main import app, prediction_repo
    FASTAPI_AVAILABLE = True
except Exception:
    FASTAPI_AVAILABLE = False


# =========================================================================== #
#  Helpers
# =========================================================================== #
def _make_mock_store(connected: bool = True) -> MongoPredictionStore:
    """Return a MongoPredictionStore whose MongoDB calls are mocked."""
    store = MongoPredictionStore.__new__(MongoPredictionStore)
    store.uri     = "mongodb://mock:27017"
    store.db_name = "srdapo_test"
    store.client  = MagicMock() if connected else None

    if connected:
        mock_db = MagicMock()
        store.db = mock_db
    else:
        store.db = None

    return store


# =========================================================================== #
#  WHITE BOX TESTS  (WB-1 … WB-5)
# =========================================================================== #
class TestWhiteBox_EnsureDatabaseObjects(unittest.TestCase):
    """
    WB-1 & WB-2: Verify internal collection-creation and index-creation
    logic inside MongoPredictionStore.ensure_database_objects().
    """

    def _build_store_with_collections(self, existing_collections):
        store = _make_mock_store(connected=True)
        store.db.list_collection_names.return_value = existing_collections

        # Mock create_collection
        store.db.create_collection = MagicMock()

        # Mock each collection's create_index to return a name string
        predictions_coll = MagicMock()
        predictions_coll.create_index.return_value = "idx_model_zone"

        users_coll = MagicMock()
        users_coll.create_index.return_value = "uniq_email"

        test_cases_coll = MagicMock()
        test_cases_coll.create_index.return_value = "idx_suite_type"

        def collection_side_effect(name):
            return {
                "predictions": predictions_coll,
                "users":       users_coll,
                "test_cases":  test_cases_coll,
            }[name]

        store.db.__getitem__ = MagicMock(side_effect=collection_side_effect)
        return store

    # ------------------------------------------------------------------ #
    #  WB-1: Missing collections are detected and created
    # ------------------------------------------------------------------ #
    def test_WB1_missing_collections_are_created(self):
        """
        WB-1: When the DB has NO collections, ensure_database_objects
        must report all three in 'created_collections'.
        """
        store = self._build_store_with_collections([])
        result = store.ensure_database_objects()

        self.assertIn("users",       result["created_collections"],
                      "WB-1: 'users' should be listed as created")
        self.assertIn("test_cases",  result["created_collections"],
                      "WB-1: 'test_cases' should be listed as created")
        self.assertIn("predictions", result["created_collections"],
                      "WB-1: 'predictions' should be listed as created")

    # ------------------------------------------------------------------ #
    #  WB-2: Index-creation logic fires for all collections
    # ------------------------------------------------------------------ #
    def test_WB2_indexes_are_created(self):
        """
        WB-2: ensure_database_objects must create the three required indexes:
        idx_model_zone, uniq_email, idx_suite_type.
        """
        store = self._build_store_with_collections(
            ["predictions", "users", "test_cases"]  # all already exist
        )
        result = store.ensure_database_objects()

        self.assertIn("idx_model_zone", result["created_indexes"],
                      "WB-2: idx_model_zone index expected")
        self.assertIn("uniq_email",     result["created_indexes"],
                      "WB-2: uniq_email index expected")
        self.assertIn("idx_suite_type", result["created_indexes"],
                      "WB-2: idx_suite_type index expected")


class TestWhiteBox_ListPredictions(unittest.TestCase):
    """
    WB-3, WB-4, WB-5: Verify branching logic in
    PredictionRepository.list_predictions().
    """

    def setUp(self):
        _CACHE.clear()

    # ------------------------------------------------------------------ #
    #  WB-3: MongoDB available → returns mongo docs with source='mongodb'
    # ------------------------------------------------------------------ #
    def test_WB3_mongo_available_returns_mongodb_docs(self):
        """
        WB-3: When MongoDB is reachable and returns documents, source
        must be 'mongodb'.
        """
        mongo_doc = {"model_name": "SARIMA", "zone_id": 1,
                     "predicted_demand": 142.0, "surge_factor": 1.2}

        store = _make_mock_store(connected=True)
        store.find_predictions = MagicMock(return_value=[dict(mongo_doc)])

        repo = PredictionRepository(store=store)
        repo._connected = True

        results = repo.list_predictions()

        self.assertTrue(len(results) > 0, "WB-3: Expected at least one result")
        self.assertEqual(results[0]["source"], "mongodb",
                         "WB-3: source should be 'mongodb'")

    # ------------------------------------------------------------------ #
    #  WB-4: Mongo unavailable branch → cache docs with source='cache'
    # ------------------------------------------------------------------ #
    def test_WB4_mongo_unavailable_returns_cache(self):
        """
        WB-4: When MongoDB is NOT connected, list_predictions must fall
        back to the in-memory cache and tag results with source='cache'.
        """
        _CACHE.append({"model_name": "XGBoost", "zone_id": 2,
                       "predicted_demand": 87.0, "surge_factor": 1.0})

        store = _make_mock_store(connected=False)
        repo = PredictionRepository(store=store)
        repo._connected = False

        results = repo.list_predictions()

        self.assertTrue(len(results) > 0, "WB-4: Expected cache results")
        self.assertTrue(all(r["source"] == "cache" for r in results),
                        "WB-4: All results should have source='cache'")

    # ------------------------------------------------------------------ #
    #  WB-5: PyMongoError → graceful fallback to cache
    # ------------------------------------------------------------------ #
    def test_WB5_pymongo_error_falls_back_to_cache(self):
        """
        WB-5: If find_predictions raises PyMongoError, the method must
        catch it and return cache results (not propagate the exception).
        """
        from pymongo.errors import PyMongoError

        _CACHE.append({"model_name": "LSTM", "zone_id": 3,
                       "predicted_demand": 210.0, "surge_factor": 1.8})

        store = _make_mock_store(connected=True)
        store.find_predictions = MagicMock(side_effect=PyMongoError("boom"))

        repo = PredictionRepository(store=store)
        repo._connected = True

        try:
            results = repo.list_predictions()
        except Exception as exc:
            self.fail(f"WB-5: Exception should have been caught, got: {exc}")

        self.assertTrue(all(r["source"] == "cache" for r in results),
                        "WB-5: Fallback cache results should have source='cache'")


# =========================================================================== #
#  BLACK BOX TESTS  (BB-1, BB-2)
# =========================================================================== #
@unittest.skipUnless(FASTAPI_AVAILABLE, "FastAPI / httpx not available")
class TestBlackBox_PredictionsEndpoint(unittest.TestCase):
    """
    Black Box tests for GET /predictions.
    Testers interact ONLY via HTTP; internal DAL code is treated as a black box.
    """

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app, raise_server_exceptions=False)

    # ------------------------------------------------------------------ #
    #  BB-1: No token → 403 Forbidden
    # ------------------------------------------------------------------ #
    def test_BB1_no_token_returns_401_or_403(self):
        """
        BB-1: A request without a JWT Bearer token must be rejected.
        FastAPI's OAuth2PasswordBearer returns 401 (Unauthorized) when
        no token is supplied; some setups return 403. Both are acceptable
        access-denied responses – we verify the call is not successful (not 200).
        """
        response = self.client.get("/predictions")
        self.assertIn(
            response.status_code, [401, 403],
            f"BB-1: Expected 401 or 403, got {response.status_code}"
        )
        self.assertNotEqual(response.status_code, 200,
                            "BB-1: Unauthenticated call must NOT return 200")

    # ------------------------------------------------------------------ #
    #  BB-2: Authenticated + data → 200 OK with valid payload
    # ------------------------------------------------------------------ #
    def test_BB2_authenticated_request_returns_200_with_payload(self):
        """
        BB-2: An authenticated request that has matching data in the
        repository must return HTTP 200 with a list of prediction objects.
        """
        sample = {
            "model_name": "RandomForest",
            "zone_id": 1,
            "predicted_demand": 130.0,
            "surge_factor": 1.1,
        }

        # Patch the repository so we get a deterministic result
        with patch.object(prediction_repo, "list_predictions", return_value=[sample]):
            # Obtain a valid JWT token
            token_resp = self.client.post(
                "/auth/token",
                data={"username": "admin@srdapo.in", "password": "admin123"},
            )
            self.assertEqual(token_resp.status_code, 200,
                             "BB-2: Login should succeed")
            token = token_resp.json()["access_token"]

            # Call the protected endpoint
            pred_resp = self.client.get(
                "/predictions?model_name=RandomForest",
                headers={"Authorization": f"Bearer {token}"},
            )

        self.assertEqual(pred_resp.status_code, 200,
                         f"BB-2: Expected 200, got {pred_resp.status_code}")

        body = pred_resp.json()
        self.assertIsInstance(body, list, "BB-2: Response body should be a list")
        self.assertTrue(len(body) > 0, "BB-2: Expected at least one prediction")

        item = body[0]
        self.assertIn("model_name",       item, "BB-2: 'model_name' field missing")
        self.assertIn("zone_id",          item, "BB-2: 'zone_id' field missing")
        self.assertIn("predicted_demand", item, "BB-2: 'predicted_demand' field missing")
        self.assertIn("surge_factor",     item, "BB-2: 'surge_factor' field missing")


# =========================================================================== #
#  Test runner
# =========================================================================== #
if __name__ == "__main__":
    loader  = unittest.TestLoader()
    suite   = unittest.TestSuite()

    suite.addTests(loader.loadTestsFromTestCase(TestWhiteBox_EnsureDatabaseObjects))
    suite.addTests(loader.loadTestsFromTestCase(TestWhiteBox_ListPredictions))
    suite.addTests(loader.loadTestsFromTestCase(TestBlackBox_PredictionsEndpoint))

    runner  = unittest.TextTestRunner(verbosity=2)
    result  = runner.run(suite)
    sys.exit(0 if result.wasSuccessful() else 1)
