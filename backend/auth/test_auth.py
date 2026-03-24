import requests

BASE_URL = "http://127.0.0.1:5000"

def test_signup():
    data = {"email": "newuser@example.com", "password": "mypassword"}
    response = requests.post(f"{BASE_URL}/auth/signup", json=data)
    print("Signup:", response.status_code, response.json())

def test_login():
    data = {"email": "newuser@example.com", "password": "mypassword"}
    response = requests.post(f"{BASE_URL}/auth/login", json=data)
    print("Login:", response.status_code, response.json())

if __name__ == "__main__":
    test_signup()
    test_login()
