"""User schemas."""

from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import EmailStr
from sqlmodel import SQLModel


class UserBase(SQLModel):
    """Base user schema."""

    email: str
    personal_info: Dict[str, Any] = {}


class UserCreate(UserBase):
    """Schema for creating a new user."""

    email: EmailStr  # Override with stricter validation
    password: str


class UserUpdate(SQLModel):
    """Schema for updating a user's personal info."""

    personal_info: Dict


class UserRead(UserBase):
    """Schema for reading user data."""

    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class UserResponse(SQLModel):
    """Schema for user responses in API endpoints."""

    id: int
    email: str
    personal_info: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True
