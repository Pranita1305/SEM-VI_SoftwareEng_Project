# DAL Testing Plan (MongoDB)

## White Box Test Cases (Internal logic aware)

| ID | Component | Test Case | Expected Result |
|---|---|---|---|
| WB-1 | `MongoPredictionStore.ensure_database_objects` | Missing collections are detected and created. | Returns created collections list containing `users` and `test_cases` when absent. |
| WB-2 | `MongoPredictionStore.ensure_database_objects` | Index creation logic for all required collections. | Creates indexes `idx_model_zone`, `uniq_email`, and `idx_suite_type`. |
| WB-3 | `PredictionRepository.list_predictions` | MongoDB available and documents present. | Returns MongoDB docs with source `mongodb`. |
| WB-4 | `PredictionRepository.list_predictions` | Mongo unavailable branch. | Returns filtered cache docs with source `cache`. |
| WB-5 | `PredictionRepository.list_predictions` | Mongo raises `PyMongoError`. | Gracefully falls back to cache source. |

## Black Box Test Cases (Behavior only)

| ID | Endpoint | Test Case | Expected Result |
|---|---|---|---|
| BB-1 | `GET /predictions` | Call without token. | `403 Forbidden`. |
| BB-2 | `GET /predictions?model_name=RandomForest` | Authenticated request with repository returning one document. | `200 OK` with valid prediction payload. |

## Execution

Run all tests:

```bash
python -m unittest discover -s backend/tests -p "test_*.py"
```

Initialize MongoDB collections/indexes (DAL setup):

```bash
python -m backend.api.init_db
```