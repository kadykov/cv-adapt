"""Tests for generated CV endpoints"""

from datetime import datetime, timedelta
from typing import Dict

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
def auth_headers(test_user: User) -> Dict[str, str]:
    """Create authentication headers with JWT token."""
    access_token = create_access_token(int(test_user.id))
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
    return cv_service.create_cv(int(test_user.id), cv_data)


@pytest.fixture
def test_job_description(db: Session) -> JobDescription:
    """Create a test job description."""
    job_service = JobDescriptionService(db)
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
    cv_service = GeneratedCVService(db)
    cv_data = GeneratedCVCreate(
        detailed_cv_id=int(test_detailed_cv.id),
        job_description_id=int(test_job_description.id),
        language_code="en",
        content="""# Software Engineer

## Summary
Test summary

## Experience
- Senior Developer at Tech Corp
- Software Engineer at StartUp Inc

## Education
- BS in Computer Science""",
    )
    return cv_service.create_generated_cv(int(test_user.id), cv_data)


def test_generate_and_save_cv(
    test_user: User,
    test_detailed_cv: DetailedCV,
    test_job_description: JobDescription,
    auth_headers: Dict[str, str],
    client: TestClient,
) -> None:
    """Test generating and saving a new CV."""
    cv_data = GeneratedCVCreate(
        detailed_cv_id=int(test_detailed_cv.id),
        job_description_id=int(test_job_description.id),
        language_code="en",
        content="",  # Content will be generated
        status="draft",
        generation_parameters={
            "style": "professional",
            "focus_areas": ["python", "backend"],
            "tone": "confident",
        },
        version=1,
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
    assert data["version"] == 1

    # Content should be in markdown format
    assert "# " in data["content"]  # Should contain markdown headers
    assert data["content"].strip()  # Should not be empty


def test_get_user_generations(
    test_generated_cv: GeneratedCV, auth_headers: Dict[str, str], client: TestClient
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
    assert "version" in generated_cv
    assert "generation_parameters" in generated_cv


def test_update_generated_cv_status(
    test_generated_cv: GeneratedCV, auth_headers: Dict[str, str], client: TestClient
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
    test_generated_cv: GeneratedCV, auth_headers: Dict[str, str], client: TestClient
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
    test_generated_cv: GeneratedCV, auth_headers: Dict[str, str], client: TestClient
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
    auth_headers: Dict[str, str], client: TestClient
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
    other_user_token = create_access_token(int(other_user.id))
    headers = {"Authorization": f"Bearer {other_user_token}"}

    # Try to access first user's CV
    response = client.get(
        f"/v1/api/generations/{test_generated_cv.id}", headers=headers
    )
    assert response.status_code == 403


def test_generated_cv_operations_unauthorized(client: TestClient) -> None:
    """Test generated CV operations without authentication."""
    cv_data = GeneratedCVCreate(
        detailed_cv_id=1,
        job_description_id=1,
        language_code="en",
        content="content",
        status="draft",
        generation_parameters={"style": "professional"},
        version=1,
    ).model_dump()  # Convert to dict since we're sending as JSON

    update_data = {"status": "approved"}

    # Test all endpoints
    assert client.get("/v1/api/generations").status_code == 401
    assert client.get("/v1/api/generations/1").status_code == 401
    assert client.post("/v1/api/generations", json=cv_data).status_code == 401
    assert client.patch("/v1/api/generations/1", json=update_data).status_code == 401


def test_regenerate_cv(
    test_generated_cv: GeneratedCV,
    auth_headers: Dict[str, str],
    client: TestClient,
) -> None:
    """Test regenerating a CV."""
    regenerate_data = {
        "generation_parameters": {
            "style": "professional",
            "focus_areas": ["cloud", "devops"],
            "tone": "confident",
        },
        "notes": "Focus on cloud experience",
    }

    response = client.post(
        f"/v1/api/generations/{test_generated_cv.id}/regenerate",
        headers=auth_headers,
        json=regenerate_data,
    )
    assert response.status_code == 200
    data = response.json()

    # Verify basic regeneration
    assert data["detailed_cv_id"] == test_generated_cv.detailed_cv_id
    assert data["job_description_id"] == test_generated_cv.job_description_id
    assert data["version"] == test_generated_cv.version + 1
    assert data["based_on_id"] == test_generated_cv.id
    assert data["generation_parameters"]["focus_areas"] == ["cloud", "devops"]
    assert data["status"] == "draft"  # Regenerated CVs should start as drafts


def test_regenerate_cv_with_kept_sections(
    test_generated_cv: GeneratedCV,
    auth_headers: Dict[str, str],
    client: TestClient,
) -> None:
    """Test regenerating a CV while keeping specific sections."""
    regenerate_data = {
        "keep_content": True,
        "sections_to_keep": ["education", "skills"],
        "notes": "Keep education and skills sections",
    }

    response = client.post(
        f"/v1/api/generations/{test_generated_cv.id}/regenerate",
        headers=auth_headers,
        json=regenerate_data,
    )
    assert response.status_code == 200
    data = response.json()

    # Verify content contains kept sections
    assert "education" in data["content"].lower()
    assert data["status"] == "draft"
    assert data["based_on_id"] == test_generated_cv.id


def test_regenerate_nonexistent_cv(
    auth_headers: Dict[str, str],
    client: TestClient,
) -> None:
    """Test attempting to regenerate a non-existent CV."""
    regenerate_data = {
        "generation_parameters": {"style": "professional"},
    }

    response = client.post(
        "/v1/api/generations/999999/regenerate",
        headers=auth_headers,
        json=regenerate_data,
    )
    assert response.status_code == 404
    data = response.json()
    assert data["error"]["code"] == "NOT_FOUND"


def test_regenerate_other_user_cv(
    db: Session,
    test_generated_cv: GeneratedCV,
    client: TestClient,
) -> None:
    """Test attempting to regenerate another user's CV."""
    # Create another user
    user_service = UserService(db)
    other_user = user_service.create_user(
        UserCreate(email="other@example.com", password="testpassword")
    )
    other_user_token = create_access_token(int(other_user.id))
    headers = {"Authorization": f"Bearer {other_user_token}"}

    # Try to regenerate first user's CV
    regenerate_data = {
        "generation_parameters": {"style": "professional"},
    }
    response = client.post(
        f"/v1/api/generations/{test_generated_cv.id}/regenerate",
        headers=headers,
        json=regenerate_data,
    )
    assert response.status_code == 403
    data = response.json()
    assert data["error"]["code"] == "PERMISSION_DENIED"


def test_regenerate_cv_with_invalid_sections(
    test_generated_cv: GeneratedCV,
    auth_headers: Dict[str, str],
    client: TestClient,
) -> None:
    """Test regenerating a CV with invalid section names."""
    regenerate_data = {
        "keep_content": True,
        "sections_to_keep": ["invalid_section", "nonexistent"],
    }

    response = client.post(
        f"/v1/api/generations/{test_generated_cv.id}/regenerate",
        headers=auth_headers,
        json=regenerate_data,
    )
    assert response.status_code == 422
    data = response.json()
    assert data["error"]["code"] == "VALIDATION_ERROR"
    assert "invalid_section" in str(data["error"]["message"]).lower()


# New tests for enhanced filtering
def test_filter_by_multiple_statuses(
    db: Session,
    test_user: User,
    test_detailed_cv: DetailedCV,
    test_job_description: JobDescription,
    auth_headers: Dict[str, str],
    client: TestClient,
) -> None:
    """Test filtering CVs by multiple status values."""
    # Create CVs with different statuses
    cv_service = GeneratedCVService(db)
    draft_cv = cv_service.create_generated_cv(
        int(test_user.id),
        GeneratedCVCreate(
            detailed_cv_id=int(test_detailed_cv.id),
            job_description_id=int(test_job_description.id),
            language_code="en",
            content="draft content",
            status="draft",
        ),
    )
    approved_cv = cv_service.create_generated_cv(
        int(test_user.id),
        GeneratedCVCreate(
            detailed_cv_id=int(test_detailed_cv.id),
            job_description_id=int(test_job_description.id),
            language_code="en",
            content="approved content",
            status="approved",
        ),
    )

    # Test filtering by multiple statuses
    response = client.get(
        "/v1/api/generations?status=draft&status=approved",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()

    # Should find both CVs
    assert data["total"] >= 2
    cv_ids = {cv["id"] for cv in data["items"]}
    assert draft_cv.id in cv_ids
    assert approved_cv.id in cv_ids


def test_filter_by_date_ranges(
    db: Session,
    test_user: User,
    test_detailed_cv: DetailedCV,
    test_job_description: JobDescription,
    auth_headers: Dict[str, str],
    client: TestClient,
) -> None:
    """Test filtering CVs by date ranges."""
    now = datetime.utcnow()
    yesterday = now - timedelta(days=1)
    tomorrow = now + timedelta(days=1)

    # Convert to ISO format
    start_date = yesterday.isoformat()
    end_date = tomorrow.isoformat()

    response = client.get(
        f"/v1/api/generations?start_date={start_date}&end_date={end_date}",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()

    # All test CVs should be within this range
    assert data["total"] > 0
    for cv in data["items"]:
        assert start_date <= cv["created_at"] <= end_date


def test_search_cv_content(
    db: Session,
    test_user: User,
    test_detailed_cv: DetailedCV,
    test_job_description: JobDescription,
    auth_headers: Dict[str, str],
    client: TestClient,
) -> None:
    """Test searching CV content."""
    # Create CV with specific content
    cv_service = GeneratedCVService(db)
    cv = cv_service.create_generated_cv(
        int(test_user.id),
        GeneratedCVCreate(
            detailed_cv_id=int(test_detailed_cv.id),
            job_description_id=int(test_job_description.id),
            language_code="en",
            content="Python developer with React experience",
            status="draft",
            generation_parameters={"notes": "Focus on Python skills"},
        ),
    )

    # Test searching content
    response = client.get(
        "/v1/api/generations?search=python",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()

    # Should find our CV
    assert data["total"] > 0
    found_cv = next(cv_item for cv_item in data["items"] if cv_item["id"] == cv.id)
    assert found_cv is not None


def test_combined_filters(
    db: Session,
    test_user: User,
    test_detailed_cv: DetailedCV,
    test_job_description: JobDescription,
    auth_headers: Dict[str, str],
    client: TestClient,
) -> None:
    """Test combining multiple filters."""
    # Create CV that matches specific criteria
    cv_service = GeneratedCVService(db)
    cv = cv_service.create_generated_cv(
        int(test_user.id),
        GeneratedCVCreate(
            detailed_cv_id=int(test_detailed_cv.id),
            job_description_id=int(test_job_description.id),
            language_code="en",
            content="Senior Python Developer",
            status="draft",
        ),
    )

    # Test multiple filters
    now = datetime.utcnow()
    response = client.get(
        f"/v1/api/generations?status=draft&language_code=en"
        f"&start_date={now.isoformat()}&search=python"
        f"&job_description_id={test_job_description.id}",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()

    # Should find our CV
    found_cv = next(
        (cv_item for cv_item in data["items"] if cv_item["id"] == cv.id),
        None,
    )
    assert found_cv is not None
    assert found_cv["status"] == "draft"
    assert found_cv["language_code"] == "en"
    assert found_cv["job_description_id"] == test_job_description.id
