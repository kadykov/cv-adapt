"""User schemas."""

from typing import Dict

from pydantic import BaseModel, EmailStr

from .base import BaseResponseModel


class UserBase(BaseModel):
    """Base user schema."""

    email: EmailStr


class UserCreate(UserBase):
    """Schema for creating a new user."""

    password: str


class UserUpdate(BaseModel):
    """Schema for updating a user's personal info."""

    personal_info: Dict


class UserResponse(BaseResponseModel, UserBase):
    """Schema for user responses."""

    personal_info: Dict | None = None
