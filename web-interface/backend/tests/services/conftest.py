"""Service layer test fixtures."""

from datetime import UTC, datetime, timedelta
from typing import cast

import pytest
from app.core.security import create_access_token
from app.models.sqlmodels import DetailedCV, GeneratedCV, JobDescription, User
from app.schemas.cv import DetailedCVCreate, JobDescriptionCreate
from app.schemas.user import UserCreate
from app.services.cv import DetailedCVService
from app.services.job import JobDescriptionSQLModelService
from app.services.user import UserService
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
    assert test_user.id is not None, "User ID must be set"
    return cv_service.create_cv(test_user.id, cv_data)


@pytest.fixture
def test_job_description(db: Session) -> JobDescription:
    """Create a test job description."""
    job_service = JobDescriptionSQLModelService(db)
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
    assert test_user.id is not None, "User ID must be set"
    assert test_detailed_cv.id is not None, "DetailedCV ID must be set"
    assert test_job_description.id is not None, "JobDescription ID must be set"

    return {
        "user_id": test_user.id,
        "detailed_cv_id": test_detailed_cv.id,
        "job_description_id": test_job_description.id,
        "language_code": "en",
        "content": {
            "summary": "Test summary",
            "experiences": [],
            "education": [],
            "skills": [],
            "core_competences": [],
            "language": {"code": "en"},
        },
        "status": "draft",
        "generation_parameters": {"style": "professional"},
        "version": 1,
    }


@pytest.fixture
def test_generated_cv(db: Session, test_generated_cv_data: dict) -> GeneratedCV:
    """Create a test generated CV."""
    cv_data = test_generated_cv_data.copy()
    cv_data["created_at"] = datetime.now(UTC)
    generated_cv = GeneratedCV(**cv_data)
    db.add(generated_cv)
    db.commit()
    db.refresh(generated_cv)
    return generated_cv


@pytest.fixture
def test_generated_cvs(db: Session, test_generated_cv_data: dict) -> list[GeneratedCV]:
    """Create multiple test generated CVs with different statuses and dates."""
    base_date = datetime.now(UTC) - timedelta(days=3)  # Use a shorter time range
    cvs = []

    # Create CVs with different statuses and dates
    statuses = ["draft", "approved", "rejected"]
    languages = ["en", "fr", "de"]

    for i, (status, lang) in enumerate(zip(statuses * 2, languages * 2)):
        cv_data = test_generated_cv_data.copy()
        cv_data["status"] = status
        cv_data["language_code"] = lang
        cv_data["created_at"] = base_date + timedelta(days=i)
        cv_data["content"] = {
            "summary": f"Test CV content {i + 1}",
            "experiences": [],
            "education": [],
            "skills": [],
            "core_competences": [],
            "language": {"code": lang},
        }

        cv = GeneratedCV(**cv_data)
        db.add(cv)
        cvs.append(cv)

    db.commit()
    for cv in cvs:
        db.refresh(cv)

    # Sort by raw timestamp value
    return sorted(cvs, key=lambda cv: cv.created_at, reverse=True)
