"""Test endpoints for E2E testing."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.core.database import Base, engine
from app.core.deps import get_current_user
from app.core.exceptions import (
    AuthenticationError,
    EntityNotFoundError,
    GenerationError,
    ValidationError,
)
from app.models.models import User

router = APIRouter(tags=["test"])


class TestValidationModel(BaseModel):
    """Test model for validation errors."""

    status: str
    date: datetime
    language_code: str


@router.post("/error")
async def test_internal_error(
    current_user: User = Depends(get_current_user),
) -> Response:
    """Test endpoint that raises an internal server error."""
    # Raise a raw exception to test FastAPI's built-in error handling
    raise Exception("Test internal server error")


@router.post("/sensitive-error")
async def test_sensitive_error(
    current_user: User = Depends(get_current_user),
) -> Response:
    """Test endpoint that raises an error with sensitive information."""
    # Raise a raw exception with sensitive data to test FastAPI's sanitization
    raise Exception("Error with secret123 and password admin@db.example.com")


@router.post("/not-found")
async def test_not_found() -> Response:
    """Test 404 error."""
    raise EntityNotFoundError("Resource not found")


@router.post("/permission-error")
async def test_permission_error() -> Response:
    """Test permission error."""
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access denied",
    )


@router.post("/http-unauthorized")
async def test_http_unauthorized() -> Response:
    """Test generic HTTP unauthorized error."""
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
    )


@router.post("/domain-auth-error")
async def test_domain_auth_error() -> Response:
    """Test domain-specific authentication error."""
    raise AuthenticationError("Invalid token format", field="token")


@router.post("/auth-error-invalid-email")
async def test_auth_error_invalid_email() -> Response:
    """Test authentication error for invalid email."""
    raise AuthenticationError("Incorrect email or password", field="email")


@router.post("/auth-error-invalid-password")
async def test_auth_error_invalid_password() -> Response:
    """Test authentication error for invalid password."""
    raise AuthenticationError("Incorrect email or password", field="password")


@router.post("/auth-error-invalid-token")
async def test_auth_error_invalid_token() -> Response:
    """Test authentication error for invalid token."""
    raise AuthenticationError("Invalid refresh token", field="token")


@router.post("/validation-error")
async def test_validation_error(data: dict) -> Response:
    """Test single validation error."""
    raise ValidationError("Invalid status value", field="status")


@router.post("/multiple-validation-error")
async def test_multiple_validation_error(
    current_user: User = Depends(get_current_user),
) -> Response:
    """Test multiple validation errors."""
    # This will raise PydanticValidationError which is caught by FastAPI
    TestValidationModel.model_validate(
        {
            "status": None,  # Required field missing
            "date": "not-a-date",  # Invalid date format
            "language_code": 123,  # Wrong type
        }
    )
    # We won't reach here as validation will fail
    return JSONResponse(status_code=status.HTTP_200_OK, content={})


@router.post("/generation-error")
async def test_generation_error() -> Response:
    """Test generation error."""
    raise GenerationError("Failed to generate CV")


@router.post("/generation-validation-error")
async def test_generation_validation_error() -> Response:
    """Test generation validation error."""
    raise ValidationError("Invalid language code", field="language_code")


@router.post("/reset-db", response_class=JSONResponse)
async def reset_database() -> dict:
    """Reset the database to a clean state."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    return {"message": "Database reset successfully"}
