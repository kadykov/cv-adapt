"""Authentication system tests."""

from typing import Any, Generator

import pytest
from app.core.database import get_db
from app.main import app
from app.models.models import Base
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Setup in-memory test database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db() -> Generator[Any, None, None]:
    """Override database session for testing."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    """Test client fixture."""
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c
    Base.metadata.drop_all(bind=engine)


def test_register(client: TestClient) -> None:
    """Test user registration."""
    response = client.post(
        "/auth/register",
        json={
            "email": "test@example.com",
            "password": "testpassword",  # pragma: allowlist secret
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
            "password": "testpassword",  # pragma: allowlist secret
        },
    )
    assert response.status_code == 200

    # Try to register with same email
    response = client.post(
        "/auth/register",
        json={
            "email": "test@example.com",
            "password": "testpassword2",  # pragma: allowlist secret
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
            "password": "testpassword",  # pragma: allowlist secret
        },
    )

    # Test login
    response = client.post(
        "/auth/login",
        data={
            "username": "test@example.com",
            "password": "testpassword",  # pragma: allowlist secret
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
            "password": "wrongpassword",  # pragma: allowlist secret
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
            "password": "testpassword",  # pragma: allowlist secret
        },
    )

    # Then login to get fresh tokens
    response = client.post(
        "/auth/login",
        data={
            "username": "test@example.com",
            "password": "testpassword",  # pragma: allowlist secret
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
