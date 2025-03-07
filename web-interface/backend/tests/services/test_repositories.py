"""Tests for CV repository implementation."""

from typing import Any, Dict, Optional, cast

import pytest
from app.models.models import DetailedCV, GeneratedCV, JobDescription, User
from app.schemas.cv import GeneratedCVCreate
from app.services.repositories import CVRepository, EntityNotFoundError
from sqlalchemy.orm import Session


def get_id(value: Optional[Any]) -> int:
    """Get integer ID from SQLAlchemy Column or default to 1."""
    if value is None:
        return 1
    return int(value)


def test_save_generated_cv(
    db: Session,
    test_user: User,
    test_detailed_cv: DetailedCV,
    test_job_description: JobDescription,
) -> None:
    """Test saving a generated CV."""
    repository = CVRepository(db)

    # Get the IDs first
    detailed_cv_id = get_id(test_detailed_cv.id)
    job_description_id = get_id(test_job_description.id)
    user_id = get_id(test_user.id)

    cv_data = GeneratedCVCreate(
        detailed_cv_id=detailed_cv_id,  # Now it's a plain int
        job_description_id=job_description_id,  # Now it's a plain int
        language_code="en",
        content="Test CV content",  # Content should be string
        status="draft",
        generation_parameters={"param": "value"},
        version=1,
    )

    cv = repository.save_generated_cv(user_id, cv_data)

    assert cv.user_id == test_user.id
    assert cv.detailed_cv_id == test_detailed_cv.id
    assert cv.job_description_id == test_job_description.id
    assert cv.language_code == "en"
    assert cv.content == "Test CV content"
    assert cv.status == "draft"
    assert cv.generation_parameters == {"param": "value"}
    assert cv.version == 1


def test_update_status(db: Session, test_generated_cv: GeneratedCV) -> None:
    """Test updating CV status."""
    repository = CVRepository(db)
    cv_id = get_id(test_generated_cv.id)

    updated_cv = repository.update_status(cv_id, "approved")

    assert updated_cv.status == "approved"
    # Other fields should remain unchanged
    assert updated_cv.content == test_generated_cv.content
    assert updated_cv.version == test_generated_cv.version


def test_update_status_not_found(db: Session) -> None:
    """Test updating status of non-existent CV."""
    repository = CVRepository(db)

    with pytest.raises(EntityNotFoundError):
        repository.update_status(999, "approved")


def test_update_parameters(db: Session, test_generated_cv: GeneratedCV) -> None:
    """Test updating generation parameters."""
    repository = CVRepository(db)
    cv_id = get_id(test_generated_cv.id)

    new_params: Dict[str, Any] = {"new": "params"}
    updated_cv = repository.update_parameters(cv_id, new_params)

    assert updated_cv.generation_parameters == new_params
    # Other fields should remain unchanged
    assert updated_cv.content == test_generated_cv.content
    assert updated_cv.status == test_generated_cv.status


def test_update_parameters_not_found(db: Session) -> None:
    """Test updating parameters of non-existent CV."""
    repository = CVRepository(db)

    with pytest.raises(EntityNotFoundError):
        repository.update_parameters(999, {"test": "params"})


def test_get_user_generated_cvs(
    db: Session, test_generated_cv: GeneratedCV, test_user: User
) -> None:
    """Test getting all generated CVs for a user."""
    repository = CVRepository(db)
    user_id = get_id(test_user.id)

    cvs = repository.get_user_generated_cvs(user_id)

    assert len(cvs) > 0
    assert all(cv.user_id == test_user.id for cv in cvs)
    assert test_generated_cv.id in [cv.id for cv in cvs]


def test_get_generated_cv(db: Session, test_generated_cv: GeneratedCV) -> None:
    """Test getting a specific generated CV."""
    repository = CVRepository(db)
    cv_id = get_id(test_generated_cv.id)

    cv = repository.get_generated_cv(cv_id)

    assert cv is not None
    assert cv.id == test_generated_cv.id
    assert cv.content == test_generated_cv.content


def test_get_generated_cv_not_found(db: Session) -> None:
    """Test getting a non-existent generated CV."""
    repository = CVRepository(db)

    cv = repository.get_generated_cv(999)

    assert cv is None


def test_get_detailed_cv(db: Session, test_detailed_cv: DetailedCV) -> None:
    """Test getting a specific detailed CV."""
    repository = CVRepository(db)
    cv_id = get_id(test_detailed_cv.id)

    cv = repository.get_detailed_cv(cv_id)

    assert cv is not None
    assert cv.id == test_detailed_cv.id
    assert cv.content == test_detailed_cv.content


def test_get_detailed_cv_not_found(db: Session) -> None:
    """Test getting a non-existent detailed CV."""
    repository = CVRepository(db)

    cv = repository.get_detailed_cv(999)

    assert cv is None


def test_get_job_description(db: Session, test_job_description: JobDescription) -> None:
    """Test getting a specific job description."""
    repository = CVRepository(db)
    job_id = get_id(test_job_description.id)

    job = repository.get_job_description(job_id)

    assert job is not None
    assert job.id == test_job_description.id
    assert job.description == test_job_description.description


def test_get_job_description_not_found(db: Session) -> None:
    """Test getting a non-existent job description."""
    repository = CVRepository(db)

    job = repository.get_job_description(999)

    assert job is None


def test_get_detailed_cv_by_language(
    db: Session, test_detailed_cv: DetailedCV, test_user: User
) -> None:
    """Test getting a detailed CV by user and language."""
    repository = CVRepository(db)
    user_id = get_id(test_user.id)

    # We know language_code is a string column, so we can cast it safely
    lang_code = (
        cast(str, test_detailed_cv.language_code)
        if test_detailed_cv.language_code
        else "en"
    )

    cv = repository.get_detailed_cv_by_language(user_id, lang_code)

    assert cv is not None
    assert cv.id == test_detailed_cv.id
    assert cv.user_id == test_user.id
    assert cv.language_code == test_detailed_cv.language_code


def test_get_detailed_cv_by_language_not_found(db: Session) -> None:
    """Test getting a non-existent detailed CV by language."""
    repository = CVRepository(db)

    cv = repository.get_detailed_cv_by_language(999, "en")

    assert cv is None
