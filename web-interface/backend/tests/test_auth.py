"""Authentication system tests."""

from fastapi.testclient import TestClient


def test_register(client: TestClient) -> None:
    """Test user registration."""
    response = client.post(
        "/auth/register",
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


def test_register_duplicate_email(client: TestClient) -> None:
    """Test registration with duplicate email."""
    # Register first user
    response = client.post(
        "/auth/register",
        json={
            "email": "test@example.com",
            "password": "testpassword",
        },
    )
    assert response.status_code == 200

    # Try to register with same email
    response = client.post(
        "/auth/register",
        json={
            "email": "test@example.com",
            "password": "testpassword2",
        },
    )
    assert response.status_code == 400
    assert "Email already registered" in response.json()["detail"]


def test_login(client: TestClient) -> None:
    """Test user login."""
    # Register user first
    client.post(
        "/auth/register",
        json={
            "email": "test@example.com",
            "password": "testpassword",
        },
    )

    # Test login
    response = client.post(
        "/auth/login",
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
        "/auth/login",
        data={
            "username": "test@example.com",
            "password": "wrongpassword",
        },
    )
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]


def test_refresh_token(client: TestClient) -> None:
    """Test token refresh."""
    # First register the user
    client.post(
        "/auth/register",
        json={
            "email": "test@example.com",
            "password": "testpassword",
        },
    )

    # Then login to get fresh tokens
    response = client.post(
        "/auth/login",
        data={
            "username": "test@example.com",
            "password": "testpassword",
        },
    )
    assert response.status_code == 200
    refresh_token = response.json()["refresh_token"]

    # Test token refresh
    response = client.post("/auth/refresh", json={"token": refresh_token})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == "test@example.com"


def test_refresh_invalid_token(client: TestClient) -> None:
    """Test refresh with invalid token."""
    response = client.post("/auth/refresh", json={"token": "invalid_token"})
    assert response.status_code == 401
    assert "Invalid refresh token" in response.json()["detail"]
