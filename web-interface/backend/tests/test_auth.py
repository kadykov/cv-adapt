"""Authentication system tests."""

from app.services.user import UserService
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


def test_register(client: TestClient, db: Session) -> None:
    """Test user registration and ensure proper bcrypt hash format."""
    # Register a new user
    response = client.post(
        "/v1/api/auth/register",
        json={
            "email": "test@example.com",
            "password": "testpassword",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == "test@example.com"

    # Verify the user and hash format
    user_service = UserService(db)
    user = user_service.get_by_email("test@example.com")
    assert user is not None

    # Check bcrypt hash format ($2b$...)
    assert user.hashed_password.startswith("$2")

    # Verify password validation works
    assert user_service.verify_password("testpassword", str(user.hashed_password))
    assert not user_service.verify_password("wrongpassword", str(user.hashed_password))


def test_register_duplicate_email(client: TestClient) -> None:
    """Test registration with duplicate email."""
    # Register first user
    response = client.post(
        "/v1/api/auth/register",
        json={
            "email": "test@example.com",
            "password": "testpassword",
        },
    )
    assert response.status_code == 200

    # Try to register with same email
    response = client.post(
        "/v1/api/auth/register",
        json={
            "email": "test@example.com",
            "password": "testpassword2",
        },
    )
    assert response.status_code == 400
    data = response.json()
    assert "error" in data
    assert data["error"]["message"] == "Email already registered"


def test_login(client: TestClient) -> None:
    """Test user login."""
    # Register user first
    client.post(
        "/v1/api/auth/register",
        json={
            "email": "test@example.com",
            "password": "testpassword",
        },
    )

    # Test login
    response = client.post(
        "/v1/api/auth/login",
        data={
            "username": "test@example.com",
            "password": "testpassword",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == "test@example.com"


def test_login_invalid_credentials(client: TestClient) -> None:
    """Test login with invalid credentials."""
    response = client.post(
        "/v1/api/auth/login",
        data={
            "username": "test@example.com",
            "password": "wrongpassword",
        },
    )
    assert response.status_code == 401
    data = response.json()
    assert "error" in data
    assert "Incorrect email or password" in data["error"]["message"]


def test_refresh_token(client: TestClient) -> None:
    """Test token refresh."""
    # First register the user
    client.post(
        "/v1/api/auth/register",
        json={
            "email": "test@example.com",
            "password": "testpassword",
        },
    )

    # Then login to get fresh tokens
    response = client.post(
        "/v1/api/auth/login",
        data={
            "username": "test@example.com",
            "password": "testpassword",
        },
    )
    assert response.status_code == 200
    refresh_token = response.json()["refresh_token"]

    # Test token refresh
    response = client.post("/v1/api/auth/refresh", json={"token": refresh_token})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == "test@example.com"


def test_refresh_invalid_token(client: TestClient) -> None:
    """Test refresh with invalid token."""
    response = client.post("/v1/api/auth/refresh", json={"token": "invalid_token"})
    assert response.status_code == 401
    data = response.json()
    assert "error" in data
    assert "Invalid refresh token" in data["error"]["message"]
