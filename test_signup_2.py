from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

response = client.post(
    "/auth/signup",
    json={"name": "Test User 2", "email": "testuser2@example.com", "password": "password123"}
)

print(response.status_code)
print(response.json())
