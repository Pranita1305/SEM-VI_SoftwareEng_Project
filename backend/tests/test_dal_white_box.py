import unittest
from unittest.mock import patch

from pymongo.errors import PyMongoError

from backend.api.database import MongoPredictionStore
from backend.api.repository import PredictionRepository


class FakeCollection:
    def __init__(self, find_docs=None):
        self.find_docs = find_docs or []
        self.index_calls = []

    def create_index(self, keys, **kwargs):
        self.index_calls.append((keys, kwargs))

    def find(self, *_args, **_kwargs):
        return list(self.find_docs)


class FakeDB:
    def __init__(self, existing_collections=None):
        self.collections = {
            "predictions": FakeCollection(),
            "users": FakeCollection(),
            "test_cases": FakeCollection(),
        }
        self._existing = existing_collections or []
        self.created = []

    def list_collection_names(self):
        return list(self._existing)

    def create_collection(self, name):
        self.created.append(name)

    def __getitem__(self, name):
        if name not in self.collections:
            self.collections[name] = FakeCollection()
        return self.collections[name]


class FakeClient:
    def __init__(self, db):
        self._db = db

    def __getitem__(self, _name):
        return self._db


class TestDatabaseInitializationWhiteBox(unittest.TestCase):
    def test_ensure_database_objects_creates_missing_collections_and_indexes(self):
        db = FakeDB(existing_collections=["predictions"])
        store = MongoPredictionStore(client=FakeClient(db))

        result = store.ensure_database_objects()

        self.assertEqual(result["database"], "srdapo")
        self.assertEqual(result["created_collections"], ["test_cases", "users"])
        self.assertIn("predictions", result["ensured_collections"])

        predictions_indexes = db["predictions"].index_calls
        users_indexes = db["users"].index_calls
        test_indexes = db["test_cases"].index_calls

        self.assertEqual(len(predictions_indexes), 1)
        self.assertEqual(len(users_indexes), 1)
        self.assertEqual(len(test_indexes), 1)
        self.assertTrue(users_indexes[0][1]["unique"])


class TestPredictionRepositoryWhiteBox(unittest.TestCase):
    def test_list_predictions_prefers_mongodb_when_docs_exist(self):
        repo = PredictionRepository()

        fake_docs = [{"model_name": "RandomForest", "zone_id": 1}]
        with patch("backend.api.repository.prediction_store.is_available", return_value=True), patch(
            "backend.api.repository.prediction_store.predictions_collection"
        ) as mock_collection:
            mock_collection.return_value.find.return_value = fake_docs
            docs, source = repo.list_predictions(model_name="RandomForest")

        self.assertEqual(source, "mongodb")
        self.assertEqual(docs, fake_docs)

    def test_list_predictions_falls_back_to_cache_when_mongo_unavailable(self):
        repo = PredictionRepository()
        cache_docs = [
            {"model_name": "RandomForest", "zone_id": 1},
            {"model_name": "XGBoost", "zone_id": 2},
        ]

        with patch("backend.api.repository.prediction_store.is_available", return_value=False), patch(
            "backend.api.scheduler.get_cached_predictions", return_value=cache_docs
        ):
            docs, source = repo.list_predictions(model_name="randomforest")

        self.assertEqual(source, "cache")
        self.assertEqual(docs, [{"model_name": "RandomForest", "zone_id": 1}])

    def test_list_predictions_falls_back_to_cache_on_mongo_error(self):
        repo = PredictionRepository()

        with patch("backend.api.repository.prediction_store.is_available", return_value=True), patch(
            "backend.api.repository.prediction_store.predictions_collection", side_effect=PyMongoError("boom")
        ), patch(
            "backend.api.scheduler.get_cached_predictions", return_value=[{"model_name": "RandomForest"}]
        ):
            docs, source = repo.list_predictions(model_name="RandomForest")

        self.assertEqual(source, "cache")
        self.assertEqual(docs, [{"model_name": "RandomForest"}])


if __name__ == "__main__":
    unittest.main()