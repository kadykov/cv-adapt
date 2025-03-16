"""Test database models and relationships."""

from datetime import UTC, datetime

import pytest
from app.models.sqlmodels import DetailedCV, GeneratedCV, JobDescription, User
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select


@pytest.fixture
def test_user(db: Session) -> User:
    """Create a test user."""
    user = User(
        email="test@example.com",
        hashed_password="hashedpass",
        personal_info={"name": "Test User"},
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def test_user_creation(db: Session) -> None:
    """Test creating a user."""
    user = User(
        email="test@example.com",
        hashed_password="hashedpass",
        personal_info={"name": "Test User"},
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    info = user.personal_info
    assert isinstance(info, dict)
    assert user.id is not None
    assert user.email == "test@example.com"
    assert info.get("name") == "Test User"
    assert user.created_at is not None


def test_detailed_cv_creation(db: Session, test_user: User) -> None:
    """Test creating a detailed CV."""
    content = "# Software Engineer\n\n## Experience\n- Experience 1\n- Experience 2"
    cv = DetailedCV(
        user_id=test_user.id,
        language_code="en",
        content=content,
        is_primary=True,
    )
    db.add(cv)
    db.commit()
    db.refresh(cv)

    assert cv.id is not None
    assert cv.user_id == test_user.id
    assert cv.language_code == "en"
    assert isinstance(cv.content, str)
    assert "Software Engineer" in cv.content
    assert cv.created_at is not None
    assert cv.updated_at is not None


def test_job_description_creation(db: Session) -> None:
    """Test creating a job description."""
    job = JobDescription(
        title="Senior Developer",
        description="Looking for a senior developer...",
        language_code="en",
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    assert job.id is not None
    assert job.title == "Senior Developer"
    assert job.language_code == "en"
    assert job.created_at is not None
    assert job.updated_at is not None


def test_generated_cv_creation(
    db: Session,
    test_user: User,
    test_detailed_cv: DetailedCV,
    test_job_description: JobDescription,
) -> None:
    """Test creating a generated CV with all fields."""
    content = {
        "content": "# Tailored Software Engineer",
        "sections": {
            "title": "Tailored Software Engineer",
            "experience": ["Senior Developer", "Software Engineer"],
        },
    }
    generation_params = {
        "style": "professional",
        "focus_areas": ["python", "backend"],
        "tone": "confident",
    }
    generated = GeneratedCV(
        user_id=test_user.id,
        detailed_cv_id=test_detailed_cv.id,
        job_description_id=test_job_description.id,
        language_code="en",
        content=content,
        status="draft",
        generation_parameters=generation_params,
        created_at=datetime.now(UTC),
    )
    db.add(generated)
    db.commit()
    db.refresh(generated)

    assert generated.id is not None
    assert generated.user_id == test_user.id
    assert generated.detailed_cv_id == test_detailed_cv.id
    assert generated.job_description_id == test_job_description.id
    assert generated.language_code == "en"
    assert isinstance(generated.content, dict)
    assert "content" in generated.content
    assert "sections" in generated.content
    assert generated.content["sections"]["title"] == "Tailored Software Engineer"
    assert generated.content["content"] == "# Tailored Software Engineer"
    assert generated.created_at is not None
    assert generated.updated_at is not None
    assert generated.status == "draft"
    assert generated.generation_parameters == generation_params


def test_generated_cv_status_update(
    db: Session,
    test_user: User,
    test_detailed_cv: DetailedCV,
    test_job_description: JobDescription,
) -> None:
    """Test updating the status of a generated CV."""
    content = {
        "content": "# Generated CV",
        "sections": {"title": "Generated CV", "experience": []},
    }
    generated = GeneratedCV(
        user_id=test_user.id,
        detailed_cv_id=test_detailed_cv.id,
        job_description_id=test_job_description.id,
        language_code="en",
        content=content,
        status="draft",
    )
    db.add(generated)
    db.commit()
    initial_updated_at = generated.updated_at

    # Update status to approved
    generated.status = "approved"
    db.add(generated)
    db.commit()
    db.refresh(generated)

    assert generated.status == "approved"
    assert generated.updated_at > initial_updated_at


def test_user_detailed_cv_relationship(db: Session, test_user: User) -> None:
    """Test relationship between user and detailed CVs."""
    cv1 = DetailedCV(
        user_id=test_user.id,
        language_code="en",
        content="# English CV\n\nTest content",
        is_primary=True,
    )
    cv2 = DetailedCV(
        user_id=test_user.id,
        language_code="fr",
        content="# French CV\n\nTest content",
    )
    db.add(cv1)
    db.add(cv2)
    db.commit()

    # Test relationship from user to CVs
    assert len(test_user.detailed_cvs) == 2
    assert any(cv.language_code == "en" for cv in test_user.detailed_cvs)
    assert any(cv.language_code == "fr" for cv in test_user.detailed_cvs)

    # Test relationship from CV to user
    assert cv1.user.id == test_user.id
    assert cv2.user.id == test_user.id


def test_unique_language_per_user_constraint(db: Session, test_user: User) -> None:
    """Test that a user cannot have multiple CVs with same language."""
    cv1 = DetailedCV(
        user_id=test_user.id,
        language_code="en",
        content="# English CV\n\nTest content",
    )
    db.add(cv1)
    db.commit()

    # Try to add another CV with same language
    cv2 = DetailedCV(
        user_id=test_user.id,
        language_code="en",
        content="# Another English CV\n\nTest content",
    )
    db.add(cv2)
    with pytest.raises(IntegrityError):
        db.commit()


def test_cascading_delete(
    db: Session,
    test_user: User,
    test_detailed_cv: DetailedCV,
    test_job_description: JobDescription,
) -> None:
    """Test that deleting a user cascades to related objects."""
    generated = GeneratedCV(
        user_id=test_user.id,
        detailed_cv_id=test_detailed_cv.id,
        job_description_id=test_job_description.id,
        language_code="en",
        content={
            "content": "# Generated",
            "sections": {"title": "Generated", "experience": []},
        },
    )
    db.add(generated)
    db.commit()

    # Delete user and verify cascade
    db.delete(test_user)
    db.commit()

    # Check that related objects were deleted
    detailed_cvs = db.exec(
        select(DetailedCV).where(DetailedCV.user_id == test_user.id)
    ).all()
    assert len(detailed_cvs) == 0

    generated_cvs = db.exec(
        select(GeneratedCV).where(GeneratedCV.user_id == test_user.id)
    ).all()
    assert len(generated_cvs) == 0

    # Job description should remain as it's not dependent on user
    jobs = db.exec(select(JobDescription)).all()
    assert len(jobs) == 1
