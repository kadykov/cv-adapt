"""Error handling utilities for the application."""

from typing import Any, Dict, Optional

from fastapi import status
from pydantic import ValidationError as PydanticValidationError

from ..schemas.common import ErrorCode, ErrorDetail, ErrorResponse
from .exceptions import GenerationError, ValidationError


def handle_error(
    status_code: int,
    code: ErrorCode,
    message: str,
    field: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
) -> ErrorResponse:
    """Create a standardized error response.

    Args:
        status_code: HTTP status code for the response
        code: Application-specific error code
        message: Human-readable error message
        field: Optional field name where the error occurred
        details: Optional additional error details
    """
    error_detail = ErrorDetail(
        code=code,
        message=message,
        field=field,
        details=details,
    )
    return ErrorResponse(status_code=status_code, error=error_detail)


def handle_validation_error(exc: PydanticValidationError) -> ErrorResponse:
    """Handle Pydantic validation errors."""
    errors = exc.errors()
    message = "Multiple validation errors" if len(errors) > 1 else "Validation error"
    error_details = {
        "errors": errors,
        "fields": [".".join(str(loc) for loc in err.get("loc", [])) for err in errors],
    }

    return handle_error(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        code=ErrorCode.VALIDATION_ERROR,
        message=message,
        details=error_details,
    )


def handle_generation_error(exc: GenerationError) -> ErrorResponse:
    """Handle CV generation errors."""
    return handle_error(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        code=ErrorCode.GENERATION_ERROR,
        message=str(exc),
    )


def handle_generation_validation_error(exc: ValidationError) -> ErrorResponse:
    """Handle CV generation validation errors."""
    return handle_error(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        code=ErrorCode.VALIDATION_ERROR,
        message=str(exc),
        field=exc.field,
    )


def handle_not_found_error(message: str = "Resource not found") -> ErrorResponse:
    """Handle not found errors."""
    return handle_error(
        status_code=status.HTTP_404_NOT_FOUND,
        code=ErrorCode.NOT_FOUND,
        message=message,
    )


def handle_permission_error(message: str = "Access denied") -> ErrorResponse:
    """Handle permission errors."""
    return handle_error(
        status_code=status.HTTP_403_FORBIDDEN,
        code=ErrorCode.PERMISSION_DENIED,
        message=message,
    )


def handle_invalid_state_error(message: str = "Invalid state") -> ErrorResponse:
    """Handle invalid state errors."""
    return handle_error(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        code=ErrorCode.VALIDATION_ERROR,
        message=message,
    )


def handle_authentication_error(
    message: str, field: Optional[str] = None
) -> ErrorResponse:
    """Handle authentication errors."""
    return handle_error(
        status_code=status.HTTP_401_UNAUTHORIZED,
        code=ErrorCode.PERMISSION_DENIED,
        message=message,
        field=field,
    )


def handle_internal_error(message: str = "Internal server error") -> ErrorResponse:
    """Handle internal server errors."""
    return handle_error(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        code=ErrorCode.INTERNAL_ERROR,
        message=message,
    )


def handle_http_error(status_code: int, message: str) -> ErrorResponse:
    """Handle general HTTP errors."""
    if status_code == status.HTTP_404_NOT_FOUND:
        return handle_not_found_error(message)
    elif status_code == status.HTTP_403_FORBIDDEN:
        return handle_permission_error(message)
    elif status_code == status.HTTP_400_BAD_REQUEST:
        return handle_error(
            status_code=status_code,
            code=ErrorCode.VALIDATION_ERROR,
            message=message,
        )
    elif status_code == status.HTTP_401_UNAUTHORIZED:
        return handle_error(
            status_code=status_code,
            code=ErrorCode.PERMISSION_DENIED,
            message=message or "Not authenticated",
        )
    elif status_code == status.HTTP_422_UNPROCESSABLE_ENTITY:
        return handle_error(
            status_code=status_code,
            code=ErrorCode.VALIDATION_ERROR,
            message=message,
        )
    else:
        return handle_error(
            status_code=status_code,
            code=ErrorCode.INTERNAL_ERROR,
            message=message,
        )
