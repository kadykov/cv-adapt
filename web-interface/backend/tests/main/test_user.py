"""Tests for user profile endpoints"""

import pytest
from app.core.security import create_access_token
from app.models.models import User
from app.schemas.user import UserCreate
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


def test_get_user_profile(
    client: TestClient, test_user: User, auth_headers: dict[str, str]
) -> None:
    """Test successfully getting user profile."""
    response = client.get("/v1/api/users/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user.email
    assert "id" in data
    assert "created_at" in data
    assert "personal_info" in data


def test_get_user_profile_unauthorized(client: TestClient) -> None:
    """Test getting user profile without authentication."""
    response = client.get("/v1/api/users/me")
    assert response.status_code == 401


def test_update_user_profile(
    client: TestClient, test_user: User, auth_headers: dict[str, str]
) -> None:
    """Test successfully updating user profile."""
    new_personal_info = {
        "full_name": "Test User",
        "location": "Test City",
        "bio": "Test bio",
    }
    response = client.put(
        "/v1/api/users/me", headers=auth_headers, json={"personal_info": new_personal_info}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["personal_info"] == new_personal_info


def test_update_user_profile_unauthorized(client: TestClient) -> None:
    """Test updating user profile without authentication."""
    response = client.put(
        "/v1/api/users/me", json={"personal_info": {"full_name": "Test User"}}
    )
    assert response.status_code == 401
