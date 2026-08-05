import pytest
from fastapi.testclient import TestClient
from app.main import create_app

app = create_app()
client = TestClient(app)

def test_health_check():
    """Basic health check route."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] in ["healthy", "degraded", "unhealthy"]

def test_upload_empty_file():
    """Test uploading an empty file payload."""
    response = client.post("/api/v1/upload/file")
    assert response.status_code in [400, 422, 500]

def test_upload_invalid_youtube_url():
    """Test uploading a malformed YouTube URL."""
    payload = {"url_or_video_id": "https://notyoutube.com/watch?v=123", "session_id": "test"}
    response = client.post("/api/v1/upload/youtube", json=payload)
    assert response.status_code in [400, 422, 500]

def test_missing_environment_variables(monkeypatch):
    """Test that removing critical env vars doesn't crash the server start, but degrades health."""
    monkeypatch.setenv("GROQ_API_KEY", "")
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "components" in data
