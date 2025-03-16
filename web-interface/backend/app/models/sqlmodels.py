"""SQLModel-based database models."""

from datetime import UTC, datetime
from typing import Any, Dict, List, Optional

from sqlalchemy.types import JSON
from sqlmodel import Column, Field, Relationship, SQLModel, UniqueConstraint
from sqlmodel.sql.expression import Select, SelectOfScalar

SelectOfScalar.inherit_cache = True  # type: ignore
Select.inherit_cache = True  # type: ignore


class User(SQLModel, table=True):
    """User model for authentication and personal information."""

    __tablename__ = "users"
    __table_args__ = ()

    id: int = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    hashed_password: str
    personal_info: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    # Relationships
    detailed_cvs: List["DetailedCV"] = Relationship(
        back_populates="user", sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    generated_cvs: List["GeneratedCV"] = Relationship(
        back_populates="user", sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )


class JobDescription(SQLModel, table=True):
    """Stores job descriptions that can be used for CV generation."""

    __tablename__ = "job_descriptions"
    __table_args__ = ()

    id: int = Field(default=None, primary_key=True)
    title: str
    description: str
    language_code: str = Field(index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    # Relationships
    generated_cvs: List["GeneratedCV"] = Relationship(back_populates="job_description")


class DetailedCV(SQLModel, table=True):
    """Stores the detailed CV data that user enters."""

    __tablename__ = "detailed_cvs"
    __table_args__ = (
        UniqueConstraint("user_id", "language_code", name="unique_user_language"),
    )

    id: int = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    language_code: str = Field(index=True)
    content: str = Field(default="")  # Raw markdown content
    is_primary: bool = Field(default=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column_kwargs={"onupdate": lambda: datetime.now(UTC)},
    )

    # Relationships
    user: User = Relationship(back_populates="detailed_cvs")
    generated_cvs: List["GeneratedCV"] = Relationship(
        back_populates="detailed_cv",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )


class GeneratedCV(SQLModel, table=True):
    """Stores generated CVs that match DetailedCVs with JobDescriptions.
    One CV per (user, job_description, detailed_cv) combination."""

    __tablename__ = "generated_cvs"

    id: int = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    detailed_cv_id: int = Field(foreign_key="detailed_cvs.id", index=True)
    job_description_id: int = Field(foreign_key="job_descriptions.id", index=True)
    language_code: str = Field(index=True)
    content: Dict[str, Any] = Field(
        default_factory=dict, sa_column=Column(JSON)
    )  # Generated content structure
    status: str = Field(default="draft", index=True)  # draft, approved, rejected
    generation_status: str = Field(
        default="completed", index=True
    )  # generating, completed, failed
    error_message: Optional[str] = None
    generation_parameters: Dict[str, Any] = Field(
        default_factory=dict, sa_column=Column(JSON)
    )
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column_kwargs={"onupdate": lambda: datetime.now(UTC)},
    )

    # Relationships
    user: User = Relationship(back_populates="generated_cvs")
    detailed_cv: DetailedCV = Relationship(back_populates="generated_cvs")
    job_description: JobDescription = Relationship(back_populates="generated_cvs")
