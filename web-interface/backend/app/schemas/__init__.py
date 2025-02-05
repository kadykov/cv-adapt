"""Pydantic models for request/response validation."""

from .base import BaseResponseModel, TimestampedModel
from .cv import (
    DetailedCVBase,
    DetailedCVCreate,
    DetailedCVResponse,
    DetailedCVUpdate,
    GeneratedCVBase,
    GeneratedCVCreate,
    GeneratedCVResponse,
    JobDescriptionBase,
    JobDescriptionCreate,
    JobDescriptionResponse,
    JobDescriptionUpdate,
)
from .user import UserBase, UserCreate, UserResponse, UserUpdate

__all__ = [
    "BaseResponseModel",
    "TimestampedModel",
    # User schemas
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    # DetailedCV schemas
    "DetailedCVBase",
    "DetailedCVCreate",
    "DetailedCVUpdate",
    "DetailedCVResponse",
    # JobDescription schemas
    "JobDescriptionBase",
    "JobDescriptionCreate",
    "JobDescriptionUpdate",
    "JobDescriptionResponse",
    # GeneratedCV schemas
    "GeneratedCVBase",
    "GeneratedCVCreate",
    "GeneratedCVResponse",
]
