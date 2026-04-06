from unittest.mock import patch

from fastapi.testclient import TestClient

from backend.api.main import app
from backend.auth.dependencies import get_current_user


def _auth_override():
    return {"sub": "integration@test.com", "role": "user"}


def _client():
    app.dependency_overrides[get_current_user] = _auth_override
    return TestClient(app)


def test_predictions_predict_endpoint():
    client = _client()
    with patch("backend.api.routes.predictions.get_zone_by_id", return_value={"zone_id": 3, "zone_name": "Zone 3", "avg_demand": 120.0}), patch(
        "backend.api.routes.predictions.predict_traffic", return_value=7.2
    ), patch("backend.api.routes.predictions.predict_demand", return_value=190):
        response = client.post(
            "/predictions/predict",
            json={"zone_id": 3, "hour": 10, "weather": "Clear", "vehicle_type": "Cab"},
        )
    assert response.status_code == 200
    body = response.json()
    assert body["zone_id"] == 3
    assert body["predicted_demand"] == 190


def test_pricing_estimate_endpoint():
    client = _client()
    with patch(
        "backend.api.routes.pricing.estimate_fare",
        return_value={
            "zone_id": 2,
            "zone_name": "Zone 2",
            "distance_km": 5.5,
            "base_fare": 96.0,
            "surge_multiplier": 1.2,
            "final_fare": 115.2,
            "current_demand": 140,
            "weather": "Clear",
            "hour": 11,
        },
    ):
        response = client.post("/pricing/estimate", json={"zone_id": 2, "distance_km": 5.5})
    assert response.status_code == 200
    assert response.json()["final_fare"] == 115.2


def test_chatbot_query_endpoint():
    client = _client()
    with patch(
        "backend.api.routes.chatbot.chatbot_service.answer",
        return_value={
            "answer": "Zone 4 is high demand",
            "intent": "high_demand",
            "source": "cache",
            "supporting_points": ["Zone 4: 210 rides"],
            "insights": [{"label": "Hotspot", "value": "Zone 4"}],
        },
    ):
        response = client.post("/chatbot/query", json={"message": "high demand", "model_name": "RandomForest"})
    assert response.status_code == 200
    assert response.json()["intent"] == "high_demand"


def test_zones_list_and_detail_endpoints():
    client = _client()
    fake_zone = {
        "zone_id": 1,
        "zone_name": "Downtown",
        "latitude": 12.1,
        "longitude": 77.6,
        "cluster_id": 1,
        "avg_demand": 100.0,
    }
    fake_prediction = {
        "zone_id": 1,
        "zone_name": "Downtown",
        "model_name": "RandomForest",
        "current_demand": 130,
        "surge_multiplier": 1.2,
        "trend": "moderate",
        "forecast": [{"hour_offset": 0, "predicted_demand": 130, "predicted_traffic": 6.0}],
    }

    with patch("backend.api.routes.zones.get_zone_metadata", return_value=[fake_zone]), patch(
        "backend.api.routes.zones.prediction_repository.list_predictions",
        return_value=([fake_prediction], "cache"),
    ):
        list_response = client.get("/zones")
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1

    with patch("backend.api.routes.zones.get_zone_by_id", return_value=fake_zone), patch(
        "backend.api.routes.zones.prediction_repository.list_predictions",
        return_value=([fake_prediction], "cache"),
    ):
        detail_response = client.get("/zones/1")
    assert detail_response.status_code == 200
    assert detail_response.json()["zone_id"] == 1