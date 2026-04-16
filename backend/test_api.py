"""
Self-contained integration tests for SRDAPO backend.

Run with:
    python3 backend/test_api.py

The server must already be running:
    uvicorn backend.api.main:app --reload --port 8000
"""

import json
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import jwt  # PyJWT  (already in requirements.txt)
import requests

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
BASE_URL = "http://127.0.0.1:8000"
TIMEOUT = 10

# Read SECRET_KEY from backend/.env (same path the app uses)
_env_path = Path(__file__).parent / ".env"
SECRET_KEY = "fallback-secret-change-me"
if _env_path.exists():
    for line in _env_path.read_text().splitlines():
        if line.startswith("SECRET_KEY="):
            SECRET_KEY = line.split("=", 1)[1].strip()
            break

# Build a valid JWT without importing any backend code
_payload = {
    "sub": "demo@srdapo.com",
    "role": "user",
    "exp": datetime.now(timezone.utc) + timedelta(hours=1),
}
TOKEN = jwt.encode(_payload, SECRET_KEY, algorithm="HS256")
AUTH = {"Authorization": f"Bearer {TOKEN}"}

# ---------------------------------------------------------------------------
# Test runner
# ---------------------------------------------------------------------------
passed = 0
failed = 0


def test(name: str, method: str, path: str, expected_status: int, **kwargs):
    global passed, failed
    url = f"{BASE_URL}{path}"
    try:
        resp = getattr(requests, method)(url, timeout=TIMEOUT, **kwargs)
        ok = resp.status_code == expected_status
        mark = "PASS" if ok else "FAIL"
        print(f"[{mark}] {name}")
        print(f"       status : {resp.status_code}  (expected {expected_status})")
        try:
            body = resp.json()
            preview = json.dumps(body, indent=2)
            if len(preview) > 500:
                preview = preview[:500] + "\n       ... (truncated)"
            print(f"       body   : {preview}")
        except Exception:
            print(f"       body   : {resp.text[:300]}")
        if ok:
            passed += 1
        else:
            failed += 1
    except requests.exceptions.ConnectionError:
        print(f"[FAIL] {name}")
        print(f"       ERROR: Cannot connect to {BASE_URL} — is the server running?")
        failed += 1
    except Exception as exc:
        print(f"[FAIL] {name}")
        print(f"       ERROR: {exc}")
        failed += 1
    print()


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------
print("=" * 60)
print("  SRDAPO Backend Integration Tests")
print(f"  Server : {BASE_URL}")
print("=" * 60)
print()

test("1  Health check",                       "get",  "/",                   200)
test("2  Predictions — no token (→ 403)",     "get",  "/predictions",        403)
test("3  Predictions — with token",           "get",  "/predictions",        200, headers=AUTH)
test("4  Zones list",                         "get",  "/zones",              200, headers=AUTH)
test("5  Zone detail (zone 3)",               "get",  "/zones/3",            200, headers=AUTH)
test("6  Zone not found (zone 99)",           "get",  "/zones/99",           404, headers=AUTH)
test("7  Pricing estimate",                   "post", "/pricing/estimate",   200, headers=AUTH,
     json={"zone_id": 3, "distance_km": 8.5})
test("8  Pricing — no token (→ 403)",        "post", "/pricing/estimate",   403,
     json={"zone_id": 3, "distance_km": 8.5})
test("9  Chatbot — high demand query",        "post", "/chatbot/query",      200, headers=AUTH,
     json={"message": "Which zones are in high demand right now?"})
test("10 Chatbot — surge query",              "post", "/chatbot/query",      200, headers=AUTH,
     json={"message": "Is surge pricing active in Whitefield?"})
test("11 Chatbot — no token (→ 403)",        "post", "/chatbot/query",      403,
     json={"message": "hello"})
test("12 Auth /me — with token",             "get",  "/auth/me",            200, headers=AUTH)
test("13 Auth /me — no token (→ 403)",       "get",  "/auth/me",            403)
# Signup/login need MongoDB; expect 503 when it's not running
test("14 Auth signup — no MongoDB (→ 503)",  "post", "/auth/signup",        503,
     json={"email": "x@y.com", "password": "pass123"})

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
print("=" * 60)
total = passed + failed
print(f"  Results: {passed}/{total} passed  |  {failed} failed")
print("=" * 60)
sys.exit(0 if failed == 0 else 1)

 