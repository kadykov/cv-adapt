"""Tests for job description endpoints"""

import pytest
from app.models.models import JobDescription
from app.schemas.cv import JobDescriptionCreate
from app.services.cv import JobDescriptionService
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


@pytest.fixture
def test_job(db: Session) -> JobDescription:
    """Create a test job description."""
    job_service = JobDescriptionService(db)
    job_data = JobDescriptionCreate(
        title="Test Job", description="Test description", language_code="en"
    )
    return job_service.create_job_description(job_data)


def test_get_jobs(client: TestClient, db: Session, test_job: JobDescription) -> None:
    """Test getting all job descriptions."""
    response = client.get("/jobs")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == test_job.title
    assert data[0]["description"] == test_job.description
    assert data[0]["language_code"] == test_job.language_code


def test_get_jobs_by_language(
    client: TestClient, db: Session, test_job: JobDescription
) -> None:
    """Test getting jobs filtered by language."""
    # Test existing language
    response = client.get("/jobs", params={"language_code": "en"})
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["language_code"] == "en"

    # Test non-existing language
    response = client.get("/jobs", params={"language_code": "fr"})
    assert response.status_code == 200
    assert len(response.json()) == 0


def test_get_job_by_id(
    client: TestClient, db: Session, test_job: JobDescription
) -> None:
    """Test getting job description by ID."""
    response = client.get(f"/jobs/{test_job.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == test_job.title
    assert data["description"] == test_job.description
    assert data["language_code"] == test_job.language_code


def test_get_nonexistent_job(client: TestClient) -> None:
    """Test getting non-existent job description."""
    response = client.get("/jobs/999")
    assert response.status_code == 404


def test_create_job(client: TestClient, db: Session) -> None:
    """Test creating new job description."""
    job_data = {
        "title": "New Job",
        "description": "New description",
        "language_code": "fr",
    }
    response = client.post("/jobs", json=job_data)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == job_data["title"]
    assert data["description"] == job_data["description"]
    assert data["language_code"] == job_data["language_code"]


def test_update_job(client: TestClient, db: Session, test_job: JobDescription) -> None:
    """Test updating job description."""
    update_data = {"title": "Updated Job", "description": "Updated description"}
    response = client.put(f"/jobs/{test_job.id}", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == update_data["title"]
    assert data["description"] == update_data["description"]
    assert data["language_code"] == test_job.language_code  # Should remain unchanged


def test_update_nonexistent_job(client: TestClient) -> None:
    """Test updating non-existent job description."""
    update_data = {"title": "Updated Job", "description": "Updated description"}
    response = client.put("/jobs/999", json=update_data)
    assert response.status_code == 404


def test_delete_job(client: TestClient, db: Session, test_job: JobDescription) -> None:
    """Test deleting job description."""
    response = client.delete(f"/jobs/{test_job.id}")
    assert response.status_code == 204

    # Verify job was deleted
    response = client.get(f"/jobs/{test_job.id}")
    assert response.status_code == 404


def test_delete_nonexistent_job(client: TestClient) -> None:
    """Test deleting non-existent job description."""
    response = client.delete("/jobs/999")
    assert response.status_code == 404


def test_partial_update_job(
    client: TestClient, db: Session, test_job: JobDescription
) -> None:
    """Test partially updating job description."""
    # Update only title
    response = client.put(f"/jobs/{test_job.id}", json={"title": "New Title"})
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "New Title"
    assert data["description"] == test_job.description  # Should remain unchanged

    # Update only description
    response = client.put(
        f"/jobs/{test_job.id}", json={"description": "New Description"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "New Title"  # Should remain from previous update
    assert data["description"] == "New Description"
