"""Test configuration."""

import os
from typing import Generator

import pytest
from app.api import test as test_router
from app.core.database import Base
from app.core.deps import get_db
from app.core.security import create_access_token
from app.main import app
from app.models.models import DetailedCV, GeneratedCV, JobDescription, User
from app.schemas.cv import DetailedCVCreate, JobDescriptionCreate
from app.schemas.user import UserCreate
from app.services.cv import DetailedCVService, JobDescriptionService
from app.services.user import UserService
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

# Set testing environment
os.environ["TESTING"] = "1"

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
    """Get test client with database session and proper error handling.

    Note: raise_server_exceptions=False ensures that 500-level errors are handled
    by FastAPI's error handlers instead of being propagated to the test,
    matching production behavior.
    """
    # Setup test environment
    # Store original state
    original_overrides = app.dependency_overrides.copy()

    # Configure test environment
    app.dependency_overrides[get_db] = lambda: db
    app.include_router(test_router.router, prefix="/test")

    # Create test client with production-like error handling
    with TestClient(app, raise_server_exceptions=False) as test_client:
        yield test_client

    # Restore original state
    app.dependency_overrides = original_overrides


@pytest.fixture
def test_user(db: Session) -> User:
    """Create a test user."""
    user_service = UserService(db)
    user_data = UserCreate(email="test@example.com", password="testpassword")
    user = user_service.create_user(user_data)
    db.refresh(user)  # Ensure the user is loaded in the session
    return user


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
    user = user_service.create_user(user_data)
    db.refresh(user)
    return user


@pytest.fixture
def alt_auth_headers(alt_user: User) -> dict[str, str]:
    """Create authentication headers for alternative user."""
    access_token = create_access_token(int(alt_user.id))
    return {"Authorization": f"Bearer {access_token}"}


@pytest.fixture
def test_cv_content() -> str:
    """Create test CV content."""
    return """# Software Engineer

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


@pytest.fixture
def test_detailed_cv(db: Session, test_user: User, test_cv_content: str) -> DetailedCV:
    """Create a test detailed CV."""
    cv_service = DetailedCVService(db)
    cv_data = DetailedCVCreate(
        language_code="en", content=test_cv_content, is_primary=True
    )
    cv = cv_service.create_cv(int(test_user.id), cv_data)
    db.refresh(cv)
    return cv


@pytest.fixture
def test_job_description(db: Session) -> JobDescription:
    """Create a test job description."""
    job_service = JobDescriptionService(db)
    job_data = JobDescriptionCreate(
        title="Test Job",
        description="Test job description requiring Python and TypeScript skills.",
        language_code="en",
    )
    job = job_service.create_job_description(job_data)
    db.refresh(job)
    return job


@pytest.fixture
def test_generated_cv_content(test_cv_content: str) -> str:
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


@pytest.fixture
def test_generated_cv(
    db: Session,
    test_user: User,
    test_detailed_cv: DetailedCV,
    test_job_description: JobDescription,
    test_generated_cv_content: str,
) -> GeneratedCV:
    """Create a test generated CV."""
    cv = GeneratedCV(
        user_id=test_user.id,
        detailed_cv_id=test_detailed_cv.id,
        job_description_id=test_job_description.id,
        content=test_generated_cv_content,
        status="draft",
        language_code="en",
    )
    db.add(cv)
    db.commit()
    db.refresh(cv)
    return cv


@pytest.fixture
def auth_headers_other_user(db: Session) -> dict[str, str]:
    """Create authentication headers for a different user."""
    user_service = UserService(db)
    user_data = UserCreate(email="other@example.com", password="testpassword")
    other_user = user_service.create_user(user_data)
    db.refresh(other_user)
    access_token = create_access_token(int(other_user.id))
    return {"Authorization": f"Bearer {access_token}"}
