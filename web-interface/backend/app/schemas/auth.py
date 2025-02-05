"""Authentication schemas."""

from pydantic import BaseModel, EmailStr

from .user import UserResponse


class LoginForm(BaseModel):
    """Schema for login form data."""

    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    """Schema for authentication response."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse
