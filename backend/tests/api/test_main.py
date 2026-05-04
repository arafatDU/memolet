from fastapi.testclient import TestClient

def test_read_main(client: TestClient):
    # Verify the app root exists (even if it's 404 since no / endpoint is defined)
    response = client.get("/api/v1/auth/login")
    assert response.status_code == 405  # Method Not Allowed -> means the route exists but expects POST.
