import requests
import json

base_url = "http://localhost:8000/api/v1/auth"
headers = {"Content-Type": "application/json"}

# 1. Register a new user
register_data = {"username": "test_user_2", "password": "password123"}
print(f"Registering: {register_data}")
try:
    res = requests.post(f"{base_url}/register", json=register_data)
    print(res.status_code, res.json())
except Exception as e:
    print(e)
    
# 2. Login
login_data = {"username": "test_user_2", "password": "password123"}
print(f"Logging in: {login_data}")
res = requests.post(f"{base_url}/login", json=login_data)
print(res.status_code, res.json())
