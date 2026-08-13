import requests

token = "mock_test_test@test.com" # Just any mock token or we need a real one

# I will log in to get a real token
res = requests.post("http://127.0.0.1:8000/auth/login", json={"email": "prakasshdeva876@gmail.com", "password": "deva@2006"})
if res.status_code == 200:
    token = res.json()["access_token"]
    
    headers = {"Authorization": f"Bearer {token}"}
    res2 = requests.get("http://127.0.0.1:8000/auth/me/activity", headers=headers)
    print("Status:", res2.status_code)
    print("Body:", res2.text)
else:
    print("Login failed:", res.status_code, res.text)
