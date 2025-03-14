"""Common schemas used across the application."""

from datetime import datetime
from enum import Enum
from typing import Dict, Generic, List, Optional, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class ErrorCode(str, Enum):
    """Standard error codes for API responses."""

    VALIDATION_ERROR = "VALIDATION_ERROR"
    NOT_FOUND = "NOT_FOUND"
    PERMISSION_DENIED = "PERMISSION_DENIED"
    GENERATION_ERROR = "GENERATION_ERROR"
    INVALID_STATE = "INVALID_STATE"
    INTERNAL_ERROR = "INTERNAL_ERROR"


class ErrorDetail(BaseModel):
    """Detailed error information."""

    code: ErrorCode
    message: str
    field: Optional[str] = None
    details: Optional[Dict] = None


class ErrorResponse(BaseModel):
    """Standard error response format."""

    status_code: int = Field(..., description="HTTP status code")
    error: ErrorDetail


class PaginationParams(BaseModel):
    """Common pagination parameters."""

    offset: int = 0
    limit: int = 10


class DateRange(BaseModel):
    """Date range for filtering."""

    start: Optional[datetime] = None
    end: Optional[datetime] = None


class GeneratedCVFilters(BaseModel):
    """Filters for generated CVs."""

    status: Optional[List[str]] = None  # Support multiple status values
    language_code: Optional[str] = None
    job_description_id: Optional[int] = None
    detailed_cv_id: Optional[int] = None
    created_at: Optional[DateRange] = None
    updated_at: Optional[DateRange] = None
    search_query: Optional[str] = None  # For searching in CV content or metadata


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response."""

    items: List[T]
    total: int
    offset: int
    limit: int
    has_more: bool

    @classmethod
    def create(
        cls, items: List[T], total: int, offset: int, limit: int
    ) -> "PaginatedResponse[T]":
        """Create a paginated response."""
        return cls(
            items=items,
            total=total,
            offset=offset,
            limit=limit,
            has_more=(offset + len(items)) < total,
        )
