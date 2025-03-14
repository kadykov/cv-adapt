"""FastAPI exception handlers configuration."""

from fastapi import Request
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from .errors import (
    handle_authentication_error,
    handle_generation_error,
    handle_generation_validation_error,
    handle_not_found_error,
    handle_validation_error,
)
from .exceptions import (
    AuthenticationError,
    EntityNotFoundError,
    GenerationError,
)
from .exceptions import (
    ValidationError as GenerationValidationError,
)


async def validation_exception_handler(
    request: Request, exc: ValidationError
) -> JSONResponse:
    """Handle Pydantic validation errors."""
    error_response = handle_validation_error(exc)
    return JSONResponse(
        status_code=error_response.status_code,
        content=error_response.model_dump(),
    )


async def generation_exception_handler(
    request: Request, exc: GenerationError
) -> JSONResponse:
    """Handle CV generation errors."""
    error_response = handle_generation_error(exc)
    return JSONResponse(
        status_code=error_response.status_code,
        content=error_response.model_dump(),
    )


async def generation_validation_exception_handler(
    request: Request, exc: GenerationValidationError
) -> JSONResponse:
    """Handle CV generation validation errors."""
    error_response = handle_generation_validation_error(exc)
    return JSONResponse(
        status_code=error_response.status_code,
        content=error_response.model_dump(),
    )


async def authentication_exception_handler(
    request: Request, exc: AuthenticationError
) -> JSONResponse:
    """Handle authentication errors."""
    error_response = handle_authentication_error(str(exc), field=exc.field)
    return JSONResponse(
        status_code=error_response.status_code,
        content=error_response.model_dump(),
    )


async def entity_not_found_exception_handler(
    request: Request, exc: EntityNotFoundError
) -> JSONResponse:
    """Handle entity not found errors."""
    error_response = handle_not_found_error(str(exc))
    return JSONResponse(
        status_code=error_response.status_code,
        content=error_response.model_dump(),
    )
