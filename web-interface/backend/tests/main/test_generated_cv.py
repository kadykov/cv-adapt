"""Tests for generated CV endpoints"""

import pytest
from app.core.security import create_access_token
from app.models.models import DetailedCV, GeneratedCV, JobDescription, User
from app.schemas.cv import DetailedCVCreate, GeneratedCVCreate, JobDescriptionCreate
from app.schemas.user import UserCreate
from app.services.cv import DetailedCVService, GeneratedCVService, JobDescriptionService
from app.services.user import UserService
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


@pytest.fixture
def test_user(db: Session) -> User:
    """Create a test user."""
    user_service = UserService(db)
    user_data = UserCreate(email="test@example.com", password="testpassword")
    return user_service.create_user(user_data)


@pytest.fixture
def auth_headers(test_user: User) -> dict[str, str]:
    """Create authentication headers with JWT token."""
    access_token = create_access_token(int(test_user.id))
    return {"Authorization": f"Bearer {access_token}"}


@pytest.fixture
def test_detailed_cv(db: Session, test_user: User) -> DetailedCV:
    """Create a test detailed CV."""
    cv_service = DetailedCVService(db)
    cv_data = DetailedCVCreate(
        language_code="en", content={"test": "content"}, is_primary=True
    )
    return cv_service.create_cv(int(test_user.id), cv_data)


@pytest.fixture
def test_job_description(db: Session) -> JobDescription:
    """Create a test job description."""
    job_service = JobDescriptionService(db)
    job_data = JobDescriptionCreate(
        title="Test Job", description="Test description", language_code="en"
    )
    return job_service.create_job_description(job_data)


@pytest.fixture
def test_generated_cv(
    db: Session,
    test_user: User,
    test_detailed_cv: DetailedCV,
    test_job_description: JobDescription,
) -> GeneratedCV:
    """Create a test generated CV."""
    cv_service = GeneratedCVService(db)
    cv_data = GeneratedCVCreate(
        detailed_cv_id=int(test_detailed_cv.id),
        job_description_id=int(test_job_description.id),
        language_code="en",
        content={"test": "content"},
    )
    return cv_service.create_generated_cv(int(test_user.id), cv_data)


def test_generate_and_save_cv(
    test_user: User,
    test_detailed_cv: DetailedCV,
    test_job_description: JobDescription,
    auth_headers: dict[str, str],
    client: TestClient,
) -> None:
    """Test generating and saving a new CV."""
    cv_data = GeneratedCVCreate(
        detailed_cv_id=int(test_detailed_cv.id),
        job_description_id=int(test_job_description.id),
        language_code="en",
        content={"test": "content"},
    )
    response = client.post("/generate", headers=auth_headers, json=cv_data.model_dump())
    assert response.status_code == 200
    data = response.json()
    assert data["detailed_cv_id"] == test_detailed_cv.id
    assert data["job_description_id"] == test_job_description.id
    assert data["language_code"] == "en"
    assert data["content"] == cv_data.content


def test_get_user_generations(
    test_generated_cv: GeneratedCV, auth_headers: dict[str, str], client: TestClient
) -> None:
    """Test getting all user's generated CVs."""
    response = client.get("/generations", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["detailed_cv_id"] == test_generated_cv.detailed_cv_id
    assert data[0]["job_description_id"] == test_generated_cv.job_description_id
    assert data[0]["content"] == test_generated_cv.content


def test_get_generated_cv(
    test_generated_cv: GeneratedCV, auth_headers: dict[str, str], client: TestClient
) -> None:
    """Test getting specific generated CV."""
    response = client.get(f"/generations/{test_generated_cv.id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_generated_cv.id
    assert data["detailed_cv_id"] == test_generated_cv.detailed_cv_id
    assert data["job_description_id"] == test_generated_cv.job_description_id
    assert data["content"] == test_generated_cv.content


def test_get_nonexistent_generated_cv(
    auth_headers: dict[str, str], client: TestClient
) -> None:
    """Test getting non-existent generated CV."""
    response = client.get("/generations/999", headers=auth_headers)
    assert response.status_code == 404


def test_get_other_user_generated_cv(
    db: Session, test_generated_cv: GeneratedCV, client: TestClient
) -> None:
    """Test getting another user's generated CV."""
    # Create another user
    user_service = UserService(db)
    other_user = user_service.create_user(
        UserCreate(email="other@example.com", password="testpassword")
    )
    other_user_token = create_access_token(int(other_user.id))
    headers = {"Authorization": f"Bearer {other_user_token}"}

    # Try to access first user's CV
    response = client.get(f"/generations/{test_generated_cv.id}", headers=headers)
    assert response.status_code == 403


def test_generated_cv_operations_unauthorized(client: TestClient) -> None:
    """Test generated CV operations without authentication."""
    cv_data = GeneratedCVCreate(
        detailed_cv_id=1,
        job_description_id=1,
        language_code="en",
        content={"test": "content"},
    ).model_dump()  # Convert to dict since we're sending as JSON

    # Test all endpoints
    assert client.get("/generations").status_code == 401
    assert client.get("/generations/1").status_code == 401
    assert client.post("/generate", json=cv_data).status_code == 401
