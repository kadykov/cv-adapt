"""Test configuration."""

from typing import Generator

import pytest
from app.core.database import Base
from app.core.deps import get_db
from app.core.security import create_access_token
from app.main import app
from app.models.models import DetailedCV, JobDescription, User
from app.schemas.cv import DetailedCVCreate, JobDescriptionCreate
from app.schemas.user import UserCreate
from app.services.cv import DetailedCVService, JobDescriptionService
from app.services.user import UserService
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

# Create in-memory SQLite database for testing
engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db() -> Generator[Session, None, None]:
    """Test database session."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_db() -> Generator[None, None, None]:
    """Create tables in test database."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db() -> Generator[Session, None, None]:
    """Get test database session."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db: Session) -> Generator[TestClient, None, None]:
    """Get test client with database session."""
    app.dependency_overrides[get_db] = lambda: db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


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
def alt_user(db: Session) -> User:
    """Create an alternative test user."""
    user_service = UserService(db)
    user_data = UserCreate(email="alt@example.com", password="testpassword")
    return user_service.create_user(user_data)


@pytest.fixture
def alt_auth_headers(alt_user: User) -> dict[str, str]:
    """Create authentication headers for alternative user."""
    access_token = create_access_token(int(alt_user.id))
    return {"Authorization": f"Bearer {access_token}"}


@pytest.fixture
def test_detailed_cv(db: Session, test_user: User) -> DetailedCV:
    """Create a test detailed CV."""
    cv_service = DetailedCVService(db)
    cv_content = """# Software Engineer

## Experience
- Senior Developer at Tech Corp (2020-2023)
- Software Engineer at StartUp Inc (2018-2020)

## Education
- BS in Computer Science, Tech University (2014-2018)

## Skills
- Python, TypeScript, React
- Cloud Platforms (AWS, GCP)
- CI/CD, DevOps

## Core Competencies
- Technical Leadership
- System Architecture
- Team Mentoring"""

    cv_data = DetailedCVCreate(language_code="en", content=cv_content, is_primary=True)
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
def test_generated_cv_content() -> str:
    """Create test generated CV content."""
    return """# Senior Software Engineer

## Summary
Test summary

## Experience
- Senior Developer at Tech Corp
  - Led development of core platform features
  - Managed team of 5 engineers

## Education
- BS in Computer Science, Tech University

## Skills
- Python, TypeScript, React
- Cloud Platforms (AWS, GCP)
- CI/CD, DevOps

## Core Competencies
- Technical Leadership
- System Architecture
- Team Mentoring"""
