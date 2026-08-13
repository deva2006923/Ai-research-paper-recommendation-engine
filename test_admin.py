from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

client = TestClient(app)

print("Admin password loaded from env:", settings.ADMIN_PASSWORD)
response = client.post(
    "/auth/login",
    json={"email": "prakasshdeva876@gmail.com", "password": settings.ADMIN_PASSWORD}
)

print("Admin login status:", response.status_code)
if response.status_code == 200:
    print("Admin login successful!")
else:
    print("Admin login failed:", response.text)
