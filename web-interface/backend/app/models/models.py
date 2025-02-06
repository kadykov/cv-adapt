"""Database models."""

from datetime import UTC, datetime

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from ..core.database import Base

class User(Base):
    """User model for authentication and personal information."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    # Store personal info as JSON to match PersonalInfoDTO structure
    personal_info = Column(JSON)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))

    # Relationships
    detailed_cvs = relationship("DetailedCV", back_populates="user")
    generated_cvs = relationship("GeneratedCV", back_populates="user")

class DetailedCV(Base):
    """Stores the detailed CV data that user enters, can have multiple per language."""

    __tablename__ = "detailed_cvs"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    language_code = Column(String)
    # Store the entire CV content as JSON matching MinimalCVDTO structure
    # Including: title, experiences, education, skills, core_competences
    content = Column(JSON)
    is_primary = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
    updated_at = Column(
        DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC)
    )

    # Relationships
    user = relationship("User", back_populates="detailed_cvs")
    generated_cvs = relationship("GeneratedCV", back_populates="detailed_cv")

class JobDescription(Base):
    """Stores job descriptions that can be used for CV generation."""

    __tablename__ = "job_descriptions"

    id = Column(Integer, primary_key=True)
    title = Column(String)
    description = Column(Text)
    language_code = Column(String)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
    updated_at = Column(
        DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC)
    )

    # Relationships
    generated_cvs = relationship("GeneratedCV", back_populates="job_description")

class GeneratedCV(Base):
    """Stores generated CVs (output CVs) that match DetailedCVs with JobDescriptions."""

    __tablename__ = "generated_cvs"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    detailed_cv_id = Column(Integer, ForeignKey("detailed_cvs.id"))
    job_description_id = Column(Integer, ForeignKey("job_descriptions.id"))
    language_code = Column(String)
    # Store the entire generated CV as JSON matching CVDTO structure
    content = Column(JSON)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))

    # Relationships
    user = relationship("User", back_populates="generated_cvs")
    detailed_cv = relationship("DetailedCV", back_populates="generated_cvs")
    job_description = relationship("JobDescription", back_populates="generated_cvs")

# Create indexes

# Index for CV language lookup
Index("ix_detailed_cvs_language", DetailedCV.language_code)
Index(
    "ix_detailed_cvs_user_language",
    DetailedCV.user_id,
    DetailedCV.language_code,
    unique=True,
)

# Index for job description language lookup
Index("ix_job_descriptions_language", JobDescription.language_code)

# Index for generated CV lookup
Index("ix_generated_cvs_user", GeneratedCV.user_id)
Index("ix_generated_cvs_detailed_cv", GeneratedCV.detailed_cv_id)
