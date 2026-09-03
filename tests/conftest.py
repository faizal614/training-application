import pytest

from fastapi.testclient import TestClient

from backend.app.main import app


@pytest.fixture
def client():
    """
    Create a FastAPI test client.

    The TestClient is intentionally not used as a context
    manager here so the application's production lifespan
    background tasks are not started during these basic tests.
    """

    return TestClient(app)