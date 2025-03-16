"""Base schemas and mixins."""

from datetime import datetime

from sqlmodel import SQLModel


class TimestampedModel(SQLModel):
    """Base model that includes created/updated timestamps."""

    created_at: datetime
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class BaseResponseModel(SQLModel):
    """Base model for API responses."""

    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class BaseGenModel(SQLModel):
    """Base model for generation responses with timestamps."""

    id: int
    created_at: datetime
    updated_at: datetime | None = None

    class Config:
        from_attributes = True
