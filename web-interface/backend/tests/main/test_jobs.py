"""Tests for job description endpoints"""

import pytest
from app.models.models import JobDescription, User
from app.schemas.cv import JobDescriptionCreate
from app.schemas.user import UserCreate
from app.services.cv import JobDescriptionService
from app.services.user import UserService
from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

TEST_USER_EMAIL = "test@example.com"
TEST_USER_PASSWORD = "test_password"

@pytest.fixture
def test_job(db: Session) -> JobDescription:
    """Create a test job description."""
    job_service = JobDescriptionService(db)
    job_data = JobDescriptionCreate(
        title="Test Job", description="Test description", language_code="en"
    )
    return job_service.create_job_description(job_data)

from app.core.security import create_access_token

@pytest.fixture
def test_user(db: Session) -> User:
    """Create a test user."""
    user_service = UserService(db)
    user_data = UserCreate(
        email=TEST_USER_EMAIL,
        password=TEST_USER_PASSWORD
    )
    return user_service.create_user(user_data)

@pytest.fixture
def auth_headers(test_user: User) -> dict[str, str]:
    """Create auth headers with a valid test token."""
    token = create_access_token(int(test_user.id))
    return {"Authorization": f"Bearer {token}"}

def test_get_jobs(
    client: TestClient, db: Session, test_job: JobDescription, auth_headers: dict[str, str]
) -> None:
    """Test getting all job descriptions."""
    response = client.get("/v1/api/jobs", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == test_job.title
    assert data[0]["description"] == test_job.description
    assert data[0]["language_code"] == test_job.language_code

def test_get_jobs_by_language(
    client: TestClient, db: Session, test_job: JobDescription, auth_headers: dict[str, str]
) -> None:
    """Test getting jobs filtered by language."""
    # Test existing language
    response = client.get("/v1/api/jobs", params={"language_code": "en"}, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["language_code"] == "en"

    # Test non-existing language
    response = client.get("/v1/api/jobs", params={"language_code": "fr"}, headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()) == 0

def test_get_job_by_id(
    client: TestClient, db: Session, test_job: JobDescription, auth_headers: dict[str, str]
) -> None:
    """Test getting job description by ID."""
    response = client.get(f"/v1/api/jobs/{test_job.id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == test_job.title
    assert data["description"] == test_job.description
    assert data["language_code"] == test_job.language_code

def test_get_nonexistent_job(client: TestClient, auth_headers: dict[str, str]) -> None:
    """Test getting non-existent job description."""
    response = client.get("/v1/api/jobs/999", headers=auth_headers)
    assert response.status_code == 404

def test_missing_auth(client: TestClient, test_job: JobDescription) -> None:
    """Test accessing endpoints without any authentication."""
    # Test GET /jobs
    response = client.get("/v1/api/jobs")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "detail" in response.json()

    # Test GET /jobs/{id}
    response = client.get(f"/v1/api/jobs/{test_job.id}")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "detail" in response.json()

    # Test POST /jobs
    response = client.post("/v1/api/jobs", json={})
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "detail" in response.json()

    # Test PUT /jobs/{id}
    response = client.put(f"/v1/api/jobs/{test_job.id}", json={})
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "detail" in response.json()

    # Test DELETE /jobs/{id}
    response = client.delete(f"/v1/api/jobs/{test_job.id}")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "detail" in response.json()

def test_invalid_token(client: TestClient, test_job: JobDescription) -> None:
    """Test accessing endpoints with invalid token."""
    invalid_headers = {"Authorization": "Bearer invalid_token"}

    # Test GET /jobs
    response = client.get("/v1/api/jobs", headers=invalid_headers)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "detail" in response.json()

    # Test GET /jobs/{id}
    response = client.get(f"/v1/api/jobs/{test_job.id}", headers=invalid_headers)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "detail" in response.json()

def test_type_validation(client: TestClient, auth_headers: dict[str, str]) -> None:
    """Test basic type validation."""
    # Missing required fields
    response = client.post("/v1/api/jobs", json={}, headers=auth_headers)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_create_job(client: TestClient, db: Session, auth_headers: dict[str, str]) -> None:
    """Test creating new job description."""
    job_data = {
        "title": "New Job",
        "description": "New description",
        "language_code": "fr",
    }
    response = client.post("/v1/api/jobs", json=job_data, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == job_data["title"]
    assert data["description"] == job_data["description"]
    assert data["language_code"] == job_data["language_code"]

def test_update_job(
    client: TestClient, db: Session, test_job: JobDescription, auth_headers: dict[str, str]
) -> None:
    """Test updating job description."""
    update_data = {"title": "Updated Job", "description": "Updated description"}
    response = client.put(f"/v1/api/jobs/{test_job.id}", json=update_data, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == update_data["title"]
    assert data["description"] == update_data["description"]
    assert data["language_code"] == test_job.language_code  # Should remain unchanged

def test_update_nonexistent_job(client: TestClient, auth_headers: dict[str, str]) -> None:
    """Test updating non-existent job description."""
    update_data = {"title": "Updated Job", "description": "Updated description"}
    response = client.put("/v1/api/jobs/999", json=update_data, headers=auth_headers)
    assert response.status_code == 404

def test_delete_job(
    client: TestClient, db: Session, test_job: JobDescription, auth_headers: dict[str, str]
) -> None:
    """Test deleting job description."""
    response = client.delete(f"/v1/api/jobs/{test_job.id}", headers=auth_headers)
    assert response.status_code == 204

    # Verify job was deleted
    response = client.get(f"/v1/api/jobs/{test_job.id}", headers=auth_headers)
    assert response.status_code == 404

def test_delete_nonexistent_job(client: TestClient, auth_headers: dict[str, str]) -> None:
    """Test deleting non-existent job description."""
    response = client.delete("/v1/api/jobs/999", headers=auth_headers)
    assert response.status_code == 404

def test_partial_update_job(
    client: TestClient, db: Session, test_job: JobDescription, auth_headers: dict[str, str]
) -> None:
    """Test partially updating job description."""
    # Update only title
    response = client.put(f"/v1/api/jobs/{test_job.id}", json={"title": "New Title"}, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "New Title"
    assert data["description"] == test_job.description  # Should remain unchanged

    # Update only description
    response = client.put(
        f"/v1/api/jobs/{test_job.id}", json={"description": "New Description"}, headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "New Title"  # Should remain from previous update
    assert data["description"] == "New Description"
