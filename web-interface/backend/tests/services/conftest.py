"""Service layer test fixtures."""

import pytest
from app.core.security import create_access_token
from app.models.models import DetailedCV, GeneratedCV, JobDescription, User
from app.schemas.cv import DetailedCVCreate, JobDescriptionCreate
from app.schemas.user import UserCreate
from app.services.cv import DetailedCVService, JobDescriptionService
from app.services.user import UserService
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


@pytest.fixture
def test_generated_cv_data(
    test_user: User,
    test_detailed_cv: DetailedCV,
    test_job_description: JobDescription,
    test_generated_cv_content: str,
) -> dict:
    """Create test generated CV data."""
    return {
        "user_id": int(test_user.id),
        "detailed_cv_id": int(test_detailed_cv.id),
        "job_description_id": int(test_job_description.id),
        "language_code": "en",
        "content": test_generated_cv_content,
        "status": "draft",
        "generation_parameters": {"style": "professional"},
        "version": 1,
    }


@pytest.fixture
def test_generated_cv(db: Session, test_generated_cv_data: dict) -> GeneratedCV:
    """Create a test generated CV."""
    generated_cv = GeneratedCV(**test_generated_cv_data)
    db.add(generated_cv)
    db.commit()
    db.refresh(generated_cv)
    return generated_cv
