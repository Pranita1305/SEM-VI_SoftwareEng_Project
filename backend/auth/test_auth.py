"""
Manual integration test for the SRDAPO auth endpoints.
Run with: python -m backend.auth.test_auth
Make sure the server is running first:
    uvicorn backend.api.main:app --reload --port 8000
"""

import requests

BASE_URL = "http://127.0.0.1:8000"

TEST_EMAIL = "testuser@example.com"
TEST_PASSWORD = "secret123"


def test_signup():
    print("\n--- POST /auth/signup ---")
    response = requests.post(
        f"{BASE_URL}/auth/signup",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
    )
    print(f"Status: {response.status_code}")
    print(f"Body:   {response.json()}")
    return response.json().get("access_token")


def test_login():
    print("\n--- POST /auth/login ---")
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
    )
    print(f"Status: {response.status_code}")
    print(f"Body:   {response.json()}")
    return response.json().get("access_token")


def test_me(token: str):
    print("\n--- GET /auth/me ---")
    response = requests.get(
        f"{BASE_URL}/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    print(f"Status: {response.status_code}")
    print(f"Body:   {response.json()}")


def test_me_no_token():
    print("\n--- GET /auth/me (no token – expect 403) ---")
    response = requests.get(f"{BASE_URL}/auth/me")
    print(f"Status: {response.status_code}")
    print(f"Body:   {response.json()}")


if __name__ == "__main__":
    # Signup (ignore 409 if user already exists from a previous run)
    test_signup()

    # Login and get a fresh token
    token = test_login()

    if token:
        test_me(token)
    else:
        print("Login failed – skipping /me test")

    # Negative test
    test_me_no_token()
