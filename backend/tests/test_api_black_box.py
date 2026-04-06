import unittest
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.api.routes.predictions import router as predictions_router
from backend.auth.dependencies import get_current_user


class TestPredictionsAPIBlackBox(unittest.TestCase):
    def setUp(self):
        app = FastAPI()
        app.include_router(predictions_router)
        self.app = app

    def test_list_predictions_requires_auth_token(self):
        client = TestClient(self.app)

        response = client.get("/predictions")

        self.assertEqual(response.status_code, 403)

    def test_list_predictions_returns_data_for_authenticated_user(self):
        self.app.dependency_overrides[get_current_user] = lambda: {
            "sub": "tester@example.com",
            "role": "user",
        }

        fake_docs = [
            {
                "zone_id": 1,
                "zone_name": "Downtown",
                "model_name": "RandomForest",
                "current_demand": 102.3,
                "surge_multiplier": 1.2,
                "trend": "High",
                "forecast": [
                    {
                        "hour_offset": 0,
                        "timestamp": "2026-04-06T00:00:00+00:00",
                        "predicted_demand": 102.3,
                        "predicted_traffic": 0.43,
                    }
                ],
                "generated_at": "2026-04-06T00:00:00+00:00",
            }
        ]

        with patch(
            "backend.api.routes.predictions.prediction_repository.list_predictions",
            return_value=(fake_docs, "mongodb"),
        ):
            client = TestClient(self.app)
            response = client.get("/predictions?model_name=RandomForest")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()[0]["zone_name"], "Downtown")
        self.assertEqual(response.json()[0]["model_name"], "RandomForest")


if __name__ == "__main__":
    unittest.main()