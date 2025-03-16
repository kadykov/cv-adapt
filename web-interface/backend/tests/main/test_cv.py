"""Tests for detailed CV endpoints"""

from typing import cast

import pytest
from app.core.security import create_access_token
from app.models.sqlmodels import DetailedCV, User
from app.schemas.cv import DetailedCVCreate
from app.schemas.user import UserCreate
from app.services.cv import DetailedCVService
from app.services.user import UserService
from fastapi.testclient import TestClient
from sqlmodel import Session


@pytest.fixture
def test_user(db: Session) -> User:
    """Create a test user."""
    user_service = UserService(db)
    user_data = UserCreate(email="test@example.com", password="testpassword")
    user = user_service.create_user(user_data)
    assert user.id is not None, "User ID must be set after creation"
    return user


@pytest.fixture
def auth_headers(test_user: User) -> dict[str, str]:
    """Create authentication headers with JWT token."""
    assert test_user.id is not None, "User ID must be set"
    access_token = create_access_token(cast(int, test_user.id))
    return {"Authorization": f"Bearer {access_token}"}


@pytest.fixture
def test_cv(db: Session, test_user: User) -> DetailedCV:
    """Create a test CV."""
    cv_service = DetailedCVService(db)
    cv_data = DetailedCVCreate(
        language_code="en",
        content="# Markdown content\n\nTest content",
        is_primary=True,
    )
    assert test_user.id is not None, "User ID must be set"
    return cv_service.create_cv(cast(int, test_user.id), cv_data)


def test_get_user_cvs(
    test_cv: DetailedCV, auth_headers: dict[str, str], client: TestClient
) -> None:
    """Test getting all user's CVs."""
    response = client.get("/v1/api/user/detailed-cvs", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["language_code"] == test_cv.language_code
    assert data[0]["content"] == test_cv.content
    assert data[0]["is_primary"] == test_cv.is_primary


def test_get_user_cv_by_language(
    test_cv: DetailedCV, auth_headers: dict[str, str], client: TestClient
) -> None:
    """Test getting user's CV by language."""
    response = client.get(
        f"/v1/api/user/detailed-cvs/{test_cv.language_code}", headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["language_code"] == test_cv.language_code
    assert data["content"] == test_cv.content
    assert data["is_primary"] == test_cv.is_primary


def test_get_nonexistent_cv(auth_headers: dict[str, str], client: TestClient) -> None:
    """Test getting CV with non-existent language code."""
    response = client.get("/v1/api/user/detailed-cvs/xx", headers=auth_headers)
    assert response.status_code == 404


def test_create_cv(auth_headers: dict[str, str], client: TestClient) -> None:
    """Test creating new CV."""
    cv_data = DetailedCVCreate(
        language_code="fr",
        content="# Markdown content\n\nTest content",
        is_primary=False,
    ).model_dump()
    response = client.put(
        "/v1/api/user/detailed-cvs/fr", headers=auth_headers, json=cv_data
    )
    assert response.status_code == 200
    data = response.json()
    assert data["language_code"] == "fr"
    assert data["content"] == cv_data["content"]
    assert not data["is_primary"]


def test_update_cv(
    test_cv: DetailedCV, auth_headers: dict[str, str], client: TestClient
) -> None:
    """Test updating existing CV."""
    update_data = DetailedCVCreate(
        language_code=test_cv.language_code,
        content="# Markdown content\n\nTest content",
        is_primary=True,
    ).model_dump()
    response = client.put(
        f"/v1/api/user/detailed-cvs/{test_cv.language_code}",
        headers=auth_headers,
        json=update_data,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["content"] == update_data["content"]
    assert data["is_primary"] == update_data["is_primary"]


def test_delete_cv(
    test_cv: DetailedCV, auth_headers: dict[str, str], client: TestClient
) -> None:
    """Test deleting CV."""
    response = client.delete(
        f"/v1/api/user/detailed-cvs/{test_cv.language_code}", headers=auth_headers
    )
    assert response.status_code == 204

    # Verify CV was deleted
    response = client.get(
        f"/v1/api/user/detailed-cvs/{test_cv.language_code}", headers=auth_headers
    )
    assert response.status_code == 404


def test_set_primary_cv(
    test_cv: DetailedCV, auth_headers: dict[str, str], client: TestClient
) -> None:
    """Test setting CV as primary."""
    # First, set the existing CV to non-primary
    update_data = DetailedCVCreate(
        language_code=test_cv.language_code,
        content="# Markdown content\n\nTest content",
        is_primary=False,
    ).model_dump()
    client.put(
        f"/v1/api/user/detailed-cvs/{test_cv.language_code}",
        headers=auth_headers,
        json=update_data,
    )

    # Now set it as primary
    response = client.put(
        f"/v1/api/user/detailed-cvs/{test_cv.language_code}/primary",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_primary"]


def test_cv_operations_unauthorized(client: TestClient) -> None:
    """Test CV operations without authentication."""
    cv_data = DetailedCVCreate(
        language_code="en",
        content="# Markdown content\n\nTest content",
        is_primary=True,
    ).model_dump()

    # Test all endpoints
    assert client.get("/v1/api/user/detailed-cvs").status_code == 401
    assert client.get("/v1/api/user/detailed-cvs/en").status_code == 401
    assert client.put("/v1/api/user/detailed-cvs/en", json=cv_data).status_code == 401
    assert client.delete("/v1/api/user/detailed-cvs/en").status_code == 401
    assert client.put("/v1/api/user/detailed-cvs/en/primary").status_code == 401


def test_mismatched_language_code(
    auth_headers: dict[str, str], client: TestClient
) -> None:
    """Test creating CV with mismatched language codes."""
    cv_data = DetailedCVCreate(
        language_code="fr",  # Mismatched with URL
        content="# Markdown content\n\nTest content",
        is_primary=True,
    ).model_dump()
    response = client.put(
        "/v1/api/user/detailed-cvs/en", headers=auth_headers, json=cv_data
    )
    assert response.status_code == 400
