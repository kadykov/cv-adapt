"""CV-related schemas."""

from enum import Enum
from typing import Any, Dict, Optional

from sqlmodel import Field, SQLModel

from cv_adapter.dto.cv import CVDTO

from .base import BaseGenModel


class GenerationStatus(str, Enum):
    """CV generation status."""

    GENERATING = "generating"
    COMPLETED = "completed"
    FAILED = "failed"


class GenerationStatusResponse(SQLModel):
    """Generation status response."""

    cv_id: int
    status: GenerationStatus = Field(description="Current generation status")
    error: Optional[str] = Field(None, description="Error message if generation failed")

    class Config:
        from_attributes = True


class DetailedCVBase(SQLModel):
    """Base detailed CV schema."""

    language_code: str
    content: str = Field(default="")  # Raw markdown content
    is_primary: bool = Field(default=False)


class DetailedCVCreate(DetailedCVBase):
    """Schema for creating a detailed CV."""

    class Config:
        from_attributes = True


class DetailedCVUpdate(SQLModel):
    """Schema for updating a detailed CV."""

    content: Optional[str] = None
    is_primary: Optional[bool] = None

    class Config:
        from_attributes = True


class DetailedCVResponse(BaseGenModel, DetailedCVBase):
    """Schema for detailed CV responses."""

    user_id: int

    class Config:
        from_attributes = True


class JobDescriptionBase(SQLModel):
    """Base job description schema."""

    title: str
    description: str
    language_code: str


class JobDescriptionCreate(JobDescriptionBase):
    """Schema for creating a job description."""

    class Config:
        from_attributes = True


class JobDescriptionUpdate(SQLModel):
    """Schema for updating a job description."""

    title: Optional[str] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True


class JobDescriptionResponse(BaseGenModel, JobDescriptionBase):
    """Schema for job description responses."""

    class Config:
        from_attributes = True


class GeneratedCVBase(SQLModel):
    """Base generated CV schema."""

    language_code: str
    content: Dict[str, Any] = Field(default_factory=dict)  # Generated content structure
    status: str = Field(default="draft")  # draft, approved, rejected
    generation_status: str = Field(default="completed")  # generating, completed, failed
    error_message: Optional[str] = None
    generation_parameters: Dict[str, Any] = Field(default_factory=dict)


class GeneratedCVCreate(GeneratedCVBase):
    """Schema for creating a generated CV."""

    detailed_cv_id: int
    job_description_id: int

    class Config:
        from_attributes = True


class GeneratedCVUpdate(SQLModel):
    """Schema for updating a generated CV."""

    status: Optional[str] = None
    generation_parameters: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class GeneratedCVDirectResponse(BaseGenModel):
    """Schema for direct generated CV responses with embedded CVDTO."""

    id: int
    user_id: int
    detailed_cv_id: int
    job_description_id: int
    language_code: str
    status: str
    generation_status: str
    error_message: Optional[str] = None
    generation_parameters: Dict[str, Any]
    cv_content: Optional[CVDTO] = None

    class Config:
        from_attributes = True


class GeneratedCVResponse(BaseGenModel, GeneratedCVBase):
    """Schema for generated CV responses."""

    user_id: int
    detailed_cv_id: int
    job_description_id: int

    class Config:
        from_attributes = True
