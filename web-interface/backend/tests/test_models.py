"""Test database models and relationships."""

from typing import Generator

import pytest
from app.models.models import Base, DetailedCV, GeneratedCV, JobDescription, User
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

# Setup in-memory test database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture
def session() -> Generator[Session, None, None]:
    """Create a new database session for tests."""
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SessionLocal = sessionmaker(bind=engine)
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


def test_user_creation(session: Session) -> None:
    """Test creating a user."""
    user = User(
        email="test@example.com",
        hashed_password="hashedpass",
        personal_info={"name": "Test User"},
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    assert user.id is not None
    assert user.email == "test@example.com"
    assert user.personal_info["name"] == "Test User"
    assert user.created_at is not None


def test_detailed_cv_creation(session: Session) -> None:
    """Test creating a detailed CV."""
    # Create user first
    user = User(email="test@example.com", hashed_password="hashedpass")
    session.add(user)
    session.flush()

    cv = DetailedCV(
        user_id=user.id,
        language_code="en",
        content={"title": "Software Engineer", "experiences": []},
        is_primary=True,
    )
    session.add(cv)
    session.commit()
    session.refresh(cv)

    assert cv.id is not None
    assert cv.user_id == user.id
    assert cv.language_code == "en"
    assert cv.content["title"] == "Software Engineer"
    assert cv.created_at is not None
    assert cv.updated_at is not None


def test_job_description_creation(session: Session) -> None:
    """Test creating a job description."""
    job = JobDescription(
        title="Senior Developer",
        description="Looking for a senior developer...",
        language_code="en",
    )
    session.add(job)
    session.commit()
    session.refresh(job)

    assert job.id is not None
    assert job.title == "Senior Developer"
    assert job.language_code == "en"
    assert job.created_at is not None
    assert job.updated_at is not None


def test_generated_cv_creation(session: Session) -> None:
    """Test creating a generated CV with all fields."""
    # Create required related objects
    user = User(email="test@example.com", hashed_password="hashedpass")
    session.add(user)
    session.flush()

    cv = DetailedCV(
        user_id=user.id,
        language_code="en",
        content={"title": "Software Engineer", "experiences": []},
    )
    session.add(cv)
    session.flush()

    job = JobDescription(
        title="Senior Developer",
        description="Looking for a senior developer...",
        language_code="en",
    )
    session.add(job)
    session.flush()

    # Create generated CV with all new fields
    generated = GeneratedCV(
        user_id=user.id,
        detailed_cv_id=cv.id,
        job_description_id=job.id,
        language_code="en",
        content={"title": "Tailored Software Engineer"},
        status="draft",
        generation_parameters={
            "style": "professional",
            "focus_areas": ["python", "backend"],
            "tone": "confident",
        },
        version=1,
    )
    session.add(generated)
    session.commit()
    session.refresh(generated)

    assert generated.id is not None
    assert generated.user_id == user.id
    assert generated.detailed_cv_id == cv.id
    assert generated.job_description_id == job.id
    assert generated.language_code == "en"
    assert generated.content["title"] == "Tailored Software Engineer"
    assert generated.created_at is not None
    assert generated.updated_at is not None
    assert generated.status == "draft"
    assert generated.generation_parameters == {
        "style": "professional",
        "focus_areas": ["python", "backend"],
        "tone": "confident",
    }
    assert generated.version == 1


def test_generated_cv_status_update(session: Session) -> None:
    """Test updating the status of a generated CV."""
    # Create a CV with initial draft status
    user = User(email="test@example.com", hashed_password="hashedpass")
    session.add(user)
    session.flush()

    cv = DetailedCV(
        user_id=user.id,
        language_code="en",
        content={"title": "CV"},
    )
    session.add(cv)
    session.flush()

    job = JobDescription(
        title="Job",
        description="Description",
        language_code="en",
    )
    session.add(job)
    session.flush()

    generated = GeneratedCV(
        user_id=user.id,
        detailed_cv_id=cv.id,
        job_description_id=job.id,
        language_code="en",
        content={"title": "Generated CV"},
        status="draft",
    )
    session.add(generated)
    session.commit()
    initial_updated_at = generated.updated_at

    # Update status to approved
    setattr(generated, "status", "approved")
    session.commit()
    session.refresh(generated)

    assert generated.status == "approved"
    assert generated.updated_at > initial_updated_at


def test_generated_cv_versioning(session: Session) -> None:
    """Test version tracking for generated CVs."""
    # Create required related objects
    user = User(email="test@example.com", hashed_password="hashedpass")
    session.add(user)
    session.flush()

    cv = DetailedCV(
        user_id=user.id,
        language_code="en",
        content={"title": "Original CV"},
    )
    session.add(cv)
    session.flush()

    job = JobDescription(
        title="Job",
        description="Description",
        language_code="en",
    )
    session.add(job)
    session.flush()

    # Create first version
    v1 = GeneratedCV(
        user_id=user.id,
        detailed_cv_id=cv.id,
        job_description_id=job.id,
        language_code="en",
        content={"title": "Version 1"},
        version=1,
    )
    session.add(v1)
    session.commit()

    # Create second version
    v2 = GeneratedCV(
        user_id=user.id,
        detailed_cv_id=cv.id,
        job_description_id=job.id,
        language_code="en",
        content={"title": "Version 2"},
        version=2,
    )
    session.add(v2)
    session.commit()

    # Query all versions
    versions = (
        session.query(GeneratedCV)
        .filter_by(user_id=user.id, detailed_cv_id=cv.id, job_description_id=job.id)
        .order_by(GeneratedCV.version)
        .all()
    )

    assert len(versions) == 2
    assert [v.version for v in versions] == [1, 2]
    assert [v.content["title"] for v in versions] == ["Version 1", "Version 2"]


def test_user_detailed_cv_relationship(session: Session) -> None:
    """Test relationship between user and detailed CVs."""
    user = User(email="test@example.com", hashed_password="hashedpass")
    session.add(user)
    session.flush()

    cv1 = DetailedCV(
        user_id=user.id,
        language_code="en",
        content={"title": "English CV"},
        is_primary=True,
    )
    cv2 = DetailedCV(
        user_id=user.id, language_code="fr", content={"title": "French CV"}
    )
    session.add_all([cv1, cv2])
    session.commit()

    # Test relationship from user to CVs
    assert len(user.detailed_cvs) == 2
    assert any(cv.language_code == "en" for cv in user.detailed_cvs)
    assert any(cv.language_code == "fr" for cv in user.detailed_cvs)

    # Test relationship from CV to user
    assert cv1.user.id == user.id
    assert cv2.user.id == user.id


def test_unique_language_per_user_constraint(session: Session) -> None:
    """Test that a user cannot have multiple CVs with same language."""
    user = User(email="test@example.com", hashed_password="hashedpass")
    session.add(user)
    session.flush()

    cv1 = DetailedCV(
        user_id=user.id, language_code="en", content={"title": "English CV"}
    )
    session.add(cv1)
    session.commit()

    # Try to add another CV with same language
    cv2 = DetailedCV(
        user_id=user.id, language_code="en", content={"title": "Another English CV"}
    )
    session.add(cv2)
    with pytest.raises(Exception):  # SQLite will raise IntegrityError
        session.commit()


def test_cascading_delete(session: Session) -> None:
    """Test that deleting a user cascades to related objects."""
    # Create user and related objects
    user = User(email="test@example.com", hashed_password="hashedpass")
    session.add(user)
    session.flush()

    cv = DetailedCV(user_id=user.id, language_code="en", content={"title": "CV"})
    session.add(cv)
    session.flush()

    job = JobDescription(title="Job", description="Description", language_code="en")
    session.add(job)
    session.flush()

    generated = GeneratedCV(
        user_id=user.id,
        detailed_cv_id=cv.id,
        job_description_id=job.id,
        language_code="en",
        content={"title": "Generated"},
    )
    session.add(generated)
    session.commit()

    # Delete user and verify cascade
    session.delete(user)
    session.commit()

    # Check that related objects were deleted
    assert session.query(DetailedCV).filter_by(user_id=user.id).count() == 0
    assert session.query(GeneratedCV).filter_by(user_id=user.id).count() == 0
    # Job description should remain as it's not dependent on user
    assert session.query(JobDescription).count() == 1
