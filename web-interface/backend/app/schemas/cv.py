"""CV-related schemas."""

from enum import Enum
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field

from .base import BaseResponseModel, TimestampedModel


class GenerationStatus(str, Enum):
    """CV generation status."""

    GENERATING = "generating"
    COMPLETED = "completed"
    FAILED = "failed"


class GenerationStatusResponse(BaseModel):
    """Generation status response."""

    cv_id: int
    status: GenerationStatus = Field(description="Current generation status")
    error: Optional[str] = Field(None, description="Error message if generation failed")


class DetailedCVBase(BaseModel):
    """Base detailed CV schema."""

    language_code: str
    content: str  # Content is a plain text that can optionally contain markdown
    is_primary: bool = False


class DetailedCVCreate(DetailedCVBase):
    """Schema for creating a detailed CV."""

    pass


class DetailedCVUpdate(BaseModel):
    """Schema for updating a detailed CV."""

    content: str | None = (
        None  # Content is a plain text that can optionally contain markdown
    )
    is_primary: bool | None = None


class DetailedCVResponse(BaseResponseModel, DetailedCVBase, TimestampedModel):
    """Schema for detailed CV responses."""

    user_id: int


class JobDescriptionBase(BaseModel):
    """Base job description schema."""

    title: str
    description: str
    language_code: str


class JobDescriptionCreate(JobDescriptionBase):
    """Schema for creating a job description."""

    pass


class JobDescriptionUpdate(BaseModel):
    """Schema for updating a job description."""

    title: str | None = None
    description: str | None = None


class JobDescriptionResponse(BaseResponseModel, JobDescriptionBase, TimestampedModel):
    """Schema for job description responses."""

    pass


class GeneratedCVBase(BaseModel):
    """Base generated CV schema."""

    language_code: str
    content: str  # Content is a plain text that can optionally contain markdown
    status: str = "draft"  # draft, approved, rejected
    generation_parameters: Dict[str, Any] | None = None
    version: int = 1


class GeneratedCVCreate(GeneratedCVBase):
    """Schema for creating a generated CV."""

    detailed_cv_id: int
    job_description_id: int


class GeneratedCVUpdate(BaseModel):
    """Schema for updating a generated CV."""

    status: str | None = None
    generation_parameters: Dict[str, Any] | None = None


class GeneratedCVResponse(BaseResponseModel, GeneratedCVBase, TimestampedModel):
    """Schema for generated CV responses."""

    user_id: int
    detailed_cv_id: int
    job_description_id: int
