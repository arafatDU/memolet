def test_generate_chat(client, mocker):
    # Mock LLM router to avoid true API calls
    mock_llm = mocker.patch("app.services.llm_router.llm_router.generate_response")
    mock_llm.return_value = {
        "choices": [
            {
                "message": {
                    "content": "This is a mocked semantic response returned securely from unit tests."
                }
            }
        ]
    }
    
    # Mock database logic since we mocked the get_db returning an empty list.
    request_data = {
        "message": "What is Memolet?",
        "active_memolet_ids": ["550e8400-e29b-41d4-a716-446655440000"]
    }
    
    response = client.post("/api/v1/chat/", json=request_data)
    
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["reply"] == "This is a mocked semantic response returned securely from unit tests."
    assert res_data["conflict_warning"] is False
    assert "confidence_heatmap" in res_data
    assert "citations" in res_data
    assert len(res_data["sentences"]) > 0

def test_fetch_sandbox_state(client):
    response = client.get("/api/v1/sandbox/state")
    assert response.status_code == 200
    assert response.json() == [] # Returns empty array from MockSession.all()
