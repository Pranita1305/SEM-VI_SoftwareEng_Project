"""
init_db.py  –  Part A: Create databases, collections, and indexes.

Run:
    python -m backend.api.init_db
"""

import logging
from backend.api.dal import MongoPredictionStore

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)


def seed_sample_data(store: MongoPredictionStore):
    """Insert sample documents so tests have data to query."""
    sample_predictions = [
        {"model_name": "SARIMA",       "zone_id": 1, "predicted_demand": 142, "surge_factor": 1.2},
        {"model_name": "XGBoost",      "zone_id": 2, "predicted_demand": 87,  "surge_factor": 1.0},
        {"model_name": "LSTM",         "zone_id": 3, "predicted_demand": 210, "surge_factor": 1.8},
        {"model_name": "RandomForest", "zone_id": 1, "predicted_demand": 130, "surge_factor": 1.1},
        {"model_name": "RandomForest", "zone_id": 4, "predicted_demand": 65,  "surge_factor": 0.9},
    ]
    for doc in sample_predictions:
        try:
            store.insert_prediction(doc)
        except Exception:
            pass   # already exists

    sample_users = [
        {"email": "admin@srdapo.in",  "role": "admin",  "hashed_password": "hashed_admin"},
        {"email": "driver@srdapo.in", "role": "driver", "hashed_password": "hashed_driver"},
    ]
    for u in sample_users:
        try:
            store.insert_user(u)
        except Exception:
            pass


def main():
    store = MongoPredictionStore()
    logger.info("Connecting to MongoDB …")

    if not store.connect():
        logger.warning("Could not connect to MongoDB. Running in offline mode.")
        logger.info("Database objects not created (MongoDB required).")
        return

    logger.info("Ensuring database objects (collections + indexes) …")
    result = store.ensure_database_objects()
    logger.info("Created collections : %s", result["created_collections"] or "(already existed)")
    logger.info("Created/confirmed indexes: %s", result["created_indexes"])

    logger.info("Seeding sample data …")
    seed_sample_data(store)
    logger.info("Done.")

    store.disconnect()


if __name__ == "__main__":
    main()
