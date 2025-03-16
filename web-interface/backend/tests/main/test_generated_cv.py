"""Tests for generated CV endpoints"""

import pytest
from app.core.security import create_access_token
from app.models.sqlmodels import DetailedCV, GeneratedCV, JobDescription, User
from app.schemas.cv import (
    DetailedCVCreate,
    GeneratedCVCreate,
    GenerationStatus,
    JobDescriptionCreate,
)
from app.schemas.user import UserCreate
from app.services.cv import DetailedCVService
from app.services.generation.generation_service import CVGenerationServiceImpl
from app.services.job import JobDescriptionSQLModelService
from app.services.user import UserService
from fastapi.testclient import TestClient
from sqlmodel import Session


@pytest.fixture
def test_user(db: Session) -> User:
    """Create a test user."""
    user_service = UserService(db)
    user_data = UserCreate(email="test@example.com", password="testpassword")
    return user_service.create_user(user_data)


@pytest.fixture
def auth_headers(test_user: User) -> dict[str, str]:
    """Create authentication headers with JWT token."""
    access_token = create_access_token(test_user.id)
    return {"Authorization": f"Bearer {access_token}"}


@pytest.fixture
def test_detailed_cv(db: Session, test_user: User) -> DetailedCV:
    """Create a test detailed CV."""
    cv_service = DetailedCVService(db)
    cv_data = DetailedCVCreate(
        language_code="en",
        content="""# Software Engineer

## Experience
- Senior Developer at Tech Corp
- Software Engineer at StartUp Inc

## Education
- BS in Computer Science""",
        is_primary=True,
    )
    return cv_service.create_cv(test_user.id, cv_data)


@pytest.fixture
def test_job_description(db: Session) -> JobDescription:
    """Create a test job description."""
    job_service = JobDescriptionSQLModelService(db)
    job_data = JobDescriptionCreate(
        title="Test Job",
        description="Test job description requiring Python and TypeScript skills.",
        language_code="en",
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
    cv_service = CVGenerationServiceImpl(db)
    cv_data = GeneratedCVCreate(
        detailed_cv_id=test_detailed_cv.id,
        job_description_id=test_job_description.id,
        language_code="en",
        content={
            "content": """# Software Engineer

## Summary
Test summary

## Experience
- Senior Developer at Tech Corp
- Software Engineer at StartUp Inc

## Education
- BS in Computer Science""",
            "sections": {
                "title": "Software Engineer",
                "summary": "Test summary",
                "experience": [
                    "Senior Developer at Tech Corp",
                    "Software Engineer at StartUp Inc",
                ],
                "education": ["BS in Computer Science"],
            },
        },
        status="draft",
        generation_parameters={},
    )
    return cv_service.create_generated_cv(test_user.id, cv_data)


def test_generate_and_save_cv(
    test_user: User,
    test_detailed_cv: DetailedCV,
    test_job_description: JobDescription,
    auth_headers: dict[str, str],
    client: TestClient,
) -> None:
    """Test generating and saving a new CV."""
    cv_data = GeneratedCVCreate(
        detailed_cv_id=test_detailed_cv.id,
        job_description_id=test_job_description.id,
        language_code="en",
        content={"content": "", "sections": {}},  # Content will be generated
        status="draft",
        generation_parameters={
            "style": "professional",
            "focus_areas": ["python", "backend"],
            "tone": "confident",
        },
    )

    response = client.post(
        "/v1/api/generations", headers=auth_headers, json=cv_data.model_dump()
    )
    assert response.status_code == 200
    data = response.json()

    # Verify response data
    assert data["detailed_cv_id"] == test_detailed_cv.id
    assert data["job_description_id"] == test_job_description.id
    assert data["language_code"] == "en"
    assert data["status"] == "draft"
    assert data["generation_parameters"] == {
        "style": "professional",
        "focus_areas": ["python", "backend"],
        "tone": "confident",
    }
    # Verify CVDTO content
    assert data["cv_content"] is not None
    assert data["cv_content"]["title"] is not None
    assert data["cv_content"]["summary"] is not None
    assert isinstance(data["cv_content"]["experiences"], list)


def test_get_user_generations(
    test_generated_cv: GeneratedCV, auth_headers: dict[str, str], client: TestClient
) -> None:
    """Test getting all user's generated CVs."""
    response = client.get("/v1/api/generations", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()

    # Check pagination data
    assert data["total"] >= 1
    assert len(data["items"]) >= 1

    # Find our test CV in the items
    generated_cv = next(cv for cv in data["items"] if cv["id"] == test_generated_cv.id)
    assert generated_cv["detailed_cv_id"] == test_generated_cv.detailed_cv_id
    assert generated_cv["job_description_id"] == test_generated_cv.job_description_id
    assert generated_cv["content"] == test_generated_cv.content
    assert "status" in generated_cv
    assert "generation_parameters" in generated_cv
    # Check content structure
    assert isinstance(generated_cv["content"], dict)
    assert "content" in generated_cv["content"]
    assert "sections" in generated_cv["content"]


def test_update_generated_cv_status(
    test_generated_cv: GeneratedCV, auth_headers: dict[str, str], client: TestClient
) -> None:
    """Test updating the status of a generated CV."""
    update_data = {"status": "approved"}
    response = client.patch(
        f"/v1/api/generations/{test_generated_cv.id}",
        headers=auth_headers,
        json=update_data,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "approved"
    assert data["id"] == test_generated_cv.id


def test_update_generation_parameters(
    test_generated_cv: GeneratedCV, auth_headers: dict[str, str], client: TestClient
) -> None:
    """Test updating generation parameters of a generated CV."""
    update_data = {
        "generation_parameters": {
            "style": "casual",
            "focus_areas": ["frontend"],
            "tone": "friendly",
        }
    }
    response = client.patch(
        f"/v1/api/generations/{test_generated_cv.id}",
        headers=auth_headers,
        json=update_data,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["generation_parameters"] == update_data["generation_parameters"]
    assert data["id"] == test_generated_cv.id


def test_get_generated_cv(
    test_generated_cv: GeneratedCV, auth_headers: dict[str, str], client: TestClient
) -> None:
    """Test getting specific generated CV."""
    response = client.get(
        f"/v1/api/generations/{test_generated_cv.id}", headers=auth_headers
    )
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
    response = client.get("/v1/api/generations/999", headers=auth_headers)
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
    other_user_token = create_access_token(other_user.id)
    headers = {"Authorization": f"Bearer {other_user_token}"}

    # Try to access first user's CV
    response = client.get(
        f"/v1/api/generations/{test_generated_cv.id}", headers=headers
    )
    assert response.status_code == 403


def test_check_generation_status(
    test_generated_cv: GeneratedCV,
    auth_headers: dict[str, str],
    client: TestClient,
    db: Session,
) -> None:
    """Test checking generation status endpoint."""
    # Initial state should be default
    response = client.get(
        f"/v1/api/generations/{test_generated_cv.id}/generation-status",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["cv_id"] == test_generated_cv.id
    assert data["status"] == GenerationStatus.COMPLETED.value
    assert data["error"] is None

    # Update to failed state
    setattr(test_generated_cv, "generation_status", GenerationStatus.FAILED.value)
    setattr(test_generated_cv, "error_message", "Test error")
    db.commit()

    # Check updated status
    response = client.get(
        f"/v1/api/generations/{test_generated_cv.id}/generation-status",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == GenerationStatus.FAILED.value
    assert data["error"] == "Test error"


def test_check_generation_status_not_found(
    auth_headers: dict[str, str],
    client: TestClient,
) -> None:
    """Test getting status of non-existent CV."""
    response = client.get(
        "/v1/api/generations/999/generation-status",
        headers=auth_headers,
    )
    assert response.status_code == 404


def test_check_other_user_generation_status(
    test_generated_cv: GeneratedCV,
    db: Session,
    client: TestClient,
) -> None:
    """Test getting generation status of another user's CV."""
    # Create another user
    user_service = UserService(db)
    other_user = user_service.create_user(
        UserCreate(email="other@example.com", password="testpassword")
    )
    other_user_token = create_access_token(other_user.id)
    headers = {"Authorization": f"Bearer {other_user_token}"}

    # Try to access first user's CV status
    response = client.get(
        f"/v1/api/generations/{test_generated_cv.id}/generation-status",
        headers=headers,
    )
    assert response.status_code == 403


def test_generated_cv_operations_unauthorized(client: TestClient) -> None:
    """Test generated CV operations without authentication."""
    cv_data = GeneratedCVCreate(
        detailed_cv_id=1,
        job_description_id=1,
        language_code="en",
        content={"content": "Test content", "sections": {}},
        status="draft",
        generation_parameters={"style": "professional"},
    ).model_dump()  # Convert to dict since we're sending as JSON

    update_data = {"status": "approved"}

    # Test all endpoints
    assert client.get("/v1/api/generations").status_code == 401
    assert client.get("/v1/api/generations/1").status_code == 401
    assert client.get("/v1/api/generations/1/generation-status").status_code == 401
    assert client.post("/v1/api/generations", json=cv_data).status_code == 401
    assert client.patch("/v1/api/generations/1", json=update_data).status_code == 401
