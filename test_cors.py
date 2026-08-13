import requests

try:
    response = requests.post(
        "http://127.0.0.1:8000/auth/signup",
        json={"name": "Test User 3", "email": "testuser3@example.com", "password": "password123"}
    )
    print("Status code:", response.status_code)
    print("Text:", response.text)
except Exception as e:
    print("Error:", e)
