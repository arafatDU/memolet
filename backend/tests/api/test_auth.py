from fastapi.testclient import TestClient


def test_register_returns_access_token(client: TestClient):
    response = client.post(
        "/api/v1/auth/register",
        json={"username": "new_user", "password": "password123"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["token_type"] == "bearer"
    assert payload["access_token"]
    assert payload["user"]["username"] == "new_user"