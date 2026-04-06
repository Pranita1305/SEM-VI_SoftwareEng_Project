"""Initialize MongoDB collections/indexes required by SRDAPO DAL.

Run:
    python -m backend.api.init_db
"""

from __future__ import annotations

import json

from backend.api.database import prediction_store


if __name__ == "__main__":
    result = prediction_store.ensure_database_objects()
    print(json.dumps(result, indent=2))