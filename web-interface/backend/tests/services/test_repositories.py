"""Tests for CV repository implementation."""

from datetime import UTC, datetime, timedelta
from typing import Any, Dict, Optional, cast

import pytest
from app.models.models import DetailedCV, GeneratedCV, JobDescription, User
from app.schemas.common import DateRange, GeneratedCVFilters, PaginationParams
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


def test_get_user_generated_cvs_with_pagination(
    db: Session, test_generated_cvs: list[GeneratedCV], test_user: User
) -> None:
    """Test getting generated CVs with pagination."""
    repository = CVRepository(db)
    user_id = get_id(test_user.id)

    # Test first page
    pagination = PaginationParams(offset=0, limit=2)
    cvs_page_1, total = repository.get_user_generated_cvs(
        user_id, pagination=pagination
    )

    # Ensure we have a list of GeneratedCV objects
    assert isinstance(cvs_page_1, list)
    assert all(isinstance(cv, GeneratedCV) for cv in cvs_page_1)
    assert len(cvs_page_1) == 2  # Should return 2 items
    assert total == len(test_generated_cvs)  # Total should be all CVs

    # Test second page
    pagination = PaginationParams(offset=2, limit=2)
    cvs_page_2, total_2 = repository.get_user_generated_cvs(
        user_id, pagination=pagination
    )

    # Ensure we have a list of GeneratedCV objects
    assert isinstance(cvs_page_2, list)
    assert all(isinstance(cv, GeneratedCV) for cv in cvs_page_2)
    assert len(cvs_page_2) == 2  # Should return 2 items
    assert total_2 == total  # Total should be same

    # Check for no overlap between pages
    page_1_ids = {cv.id for cv in cvs_page_1}
    page_2_ids = {cv.id for cv in cvs_page_2}
    assert page_1_ids.intersection(page_2_ids) == set()


def test_get_user_generated_cvs_with_status_filter(
    db: Session, test_generated_cvs: list[GeneratedCV], test_user: User
) -> None:
    """Test filtering generated CVs by status."""
    repository = CVRepository(db)
    user_id = get_id(test_user.id)

    filters = GeneratedCVFilters(status=["approved"])
    cvs_list, total = repository.get_user_generated_cvs(user_id, filters=filters)

    # Ensure we have a list of GeneratedCV objects
    assert isinstance(cvs_list, list)
    assert len(cvs_list) > 0
    assert all(isinstance(cv, GeneratedCV) for cv in cvs_list)
    assert all(cv.status in ["approved"] for cv in cvs_list)
    assert total == len([cv for cv in test_generated_cvs if cv.status == "approved"])


def test_get_user_generated_cvs_with_language_filter(
    db: Session, test_generated_cvs: list[GeneratedCV], test_user: User
) -> None:
    """Test filtering generated CVs by language."""
    repository = CVRepository(db)
    user_id = get_id(test_user.id)

    filters = GeneratedCVFilters(language_code="fr")
    cvs_list, total = repository.get_user_generated_cvs(user_id, filters=filters)

    # Ensure we have a list of GeneratedCV objects
    assert isinstance(cvs_list, list)
    assert len(cvs_list) > 0
    assert all(isinstance(cv, GeneratedCV) for cv in cvs_list)
    assert all(cv.language_code == "fr" for cv in cvs_list)
    assert total == len([cv for cv in test_generated_cvs if cv.language_code == "fr"])


def test_get_user_generated_cvs_with_date_filter(
    db: Session, test_generated_cvs: list[GeneratedCV], test_user: User
) -> None:
    """Test filtering generated CVs by date range."""
    repository = CVRepository(db)
    user_id = get_id(test_user.id)

    # Set date range for last 5 days
    end_date = datetime.now(UTC)
    start_date = end_date - timedelta(days=5)

    filters = GeneratedCVFilters(created_at=DateRange(start=start_date, end=end_date))
    cvs_list, total = repository.get_user_generated_cvs(user_id, filters=filters)

    # Ensure we have a list of GeneratedCV objects
    assert isinstance(cvs_list, list)
    assert len(cvs_list) > 0
    assert all(isinstance(cv, GeneratedCV) for cv in cvs_list)


# Helper functions for datetime handling
def get_datetime(dt: Any) -> datetime | None:
    """Get datetime from SQLAlchemy Column, Mapped value, or raw datetime."""
    if isinstance(dt, datetime):
        return dt
    try:
        value = getattr(dt, "value", None)  # Try direct value access first
        if value is None:
            value = getattr(dt, "scalar", lambda: dt)()  # Try scalar() next
        return value if isinstance(value, datetime) else None
    except (AttributeError, TypeError):
        return None


def ensure_utc(dt: Any) -> datetime:
    """Convert any datetime value to UTC or raise ValueError."""
    dt_value = get_datetime(dt)
    if dt_value is None:
        raise ValueError("Cannot convert None to UTC")
    return dt_value.replace(tzinfo=UTC) if dt_value.tzinfo is None else dt_value


def test_get_user_generated_cvs_with_combined_filters(
    db: Session, test_generated_cvs: list[GeneratedCV], test_user: User
) -> None:
    """Test filtering generated CVs with multiple filters."""
    repository = CVRepository(db)
    user_id = get_id(test_user.id)

    end_date = datetime.now(UTC)
    start_date = end_date - timedelta(days=5)

    filters = GeneratedCVFilters(
        status=["draft"],
        language_code="en",
        created_at=DateRange(start=start_date, end=end_date),
    )
    cvs_list, total = repository.get_user_generated_cvs(user_id, filters=filters)

    # Basic CV object validation
    assert isinstance(cvs_list, list)
    assert len(cvs_list) > 0
    assert all(isinstance(cv, GeneratedCV) for cv in cvs_list)

    # Status and language filter validation
    assert all(cv.status in ["draft"] for cv in cvs_list)
    assert all(cv.language_code == "en" for cv in cvs_list)

    # Date range validation
    filtered_cvs = [cv for cv in cvs_list if get_datetime(cv.created_at) is not None]
    assert filtered_cvs, "No CVs found in specified date range"
    assert all(
        start_date <= ensure_utc(cv.created_at) <= end_date for cv in filtered_cvs
    )


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
