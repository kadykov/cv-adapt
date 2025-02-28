"""Base schemas and mixins."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class TimestampedModel(BaseModel):
    """Base model that includes created/updated timestamps."""

    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class BaseResponseModel(BaseModel):
    """Base model for API responses."""

    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
