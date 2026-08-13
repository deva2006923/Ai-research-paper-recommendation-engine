from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

response = client.post(
    "/auth/signup",
    json={"name": "Test User", "email": "invalidemail", "password": "password123"}
)

print(response.status_code)
print(response.json())
