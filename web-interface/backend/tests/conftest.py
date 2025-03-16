"""Test configuration."""

from typing import Any, Generator

import pytest
from app.core.deps import get_db
from app.core.security import create_access_token
from app.main import app
from app.models.sqlmodels import DetailedCV, GeneratedCV, JobDescription, User
from app.schemas.cv import DetailedCVCreate, JobDescriptionCreate
from app.schemas.user import UserCreate
from app.services.cv import DetailedCVService
from app.services.job import JobDescriptionSQLModelService
from app.services.user import UserService
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

# Create in-memory SQLite database for testing
engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


def override_get_db() -> Generator[Session, None, None]:
    """Test database session."""
    with Session(engine) as db:
        try:
            yield db
        finally:
            db.close()


@pytest.fixture(autouse=True)
def setup_db() -> Generator[None, None, None]:
    """Create tables in test database."""
    SQLModel.metadata.create_all(bind=engine)  # This will create all tables
    yield
    SQLModel.metadata.drop_all(bind=engine)


@pytest.fixture
def db() -> Generator[Session, None, None]:
    """Get test database session."""
    with Session(engine) as session:
        # Start transaction
        session.begin()
        try:
            yield session
            # Rollback changes after test
            session.rollback()
        finally:
            session.close()


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
    user = user_service.create_user(user_data)
    assert user.id is not None, "User ID must be set after creation"
    return user


def get_user_id(user: User) -> int:
    """Safely get user ID, ensuring it exists."""
    assert user.id is not None, "User ID must be set"
    return user.id


@pytest.fixture
def auth_headers(test_user: User) -> dict[str, str]:
    """Create authentication headers with JWT token."""
    return {"Authorization": f"Bearer {create_access_token(get_user_id(test_user))}"}


@pytest.fixture
def alt_user(db: Session) -> User:
    """Create an alternative test user."""
    user_service = UserService(db)
    user_data = UserCreate(email="alt@example.com", password="testpassword")
    user = user_service.create_user(user_data)
    assert user.id is not None, "User ID must be set after creation"
    return user


@pytest.fixture
def alt_auth_headers(alt_user: User) -> dict[str, str]:
    """Create authentication headers for alternative user."""
    return {"Authorization": f"Bearer {create_access_token(get_user_id(alt_user))}"}


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
    return cv_service.create_cv(get_user_id(test_user), cv_data)


@pytest.fixture
def test_job_description(db: Session) -> JobDescription:
    """Create a test job description using SQLModel service."""
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
    # Get integer IDs
    assert test_user.id is not None, "User ID must be set"
    assert test_detailed_cv.id is not None, "DetailedCV ID must be set"
    assert test_job_description.id is not None, "JobDescription ID must be set"

    cv = GeneratedCV(
        user_id=test_user.id,
        detailed_cv_id=test_detailed_cv.id,
        job_description_id=test_job_description.id,
        language_code="en",
        content={
            "title": "Senior Software Engineer",
            "sections": {
                "summary": "Test summary",
                "experience": [
                    "Senior Developer at Tech Corp",
                    "Led development of core platform features",
                    "Managed team of 5 engineers",
                ],
                "education": ["BS in Computer Science, Tech University"],
                "skills": [
                    "Python, TypeScript, React",
                    "Cloud Platforms (AWS, GCP)",
                    "CI/CD, DevOps",
                ],
                "core_competencies": [
                    "Technical Leadership",
                    "System Architecture",
                    "Team Mentoring",
                ],
            },
        },
        status="draft",
        generation_status="completed",
        generation_parameters={"test": "params"},
    )
    db.add(cv)
    db.commit()
    db.refresh(cv)
    return cv


def test_generated_cv_content() -> dict[str, Any]:
    """Create test generated CV content."""
    return {
        "title": "Senior Software Engineer",
        "sections": {
            "summary": "Test summary",
            "experience": [
                "Senior Developer at Tech Corp",
                "Led development of core platform features",
                "Managed team of 5 engineers",
            ],
            "education": ["BS in Computer Science, Tech University"],
            "skills": [
                "Python, TypeScript, React",
                "Cloud Platforms (AWS, GCP)",
                "CI/CD, DevOps",
            ],
            "core_competencies": [
                "Technical Leadership",
                "System Architecture",
                "Team Mentoring",
            ],
        },
    }
