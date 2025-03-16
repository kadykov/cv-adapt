"""Common schemas used across the application."""

from datetime import datetime
from typing import Generic, List, Optional, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


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

    status: Optional[str] = None
    language_code: Optional[str] = None
    created_at: Optional[DateRange] = None


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
