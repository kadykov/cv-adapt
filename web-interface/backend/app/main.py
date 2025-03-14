"""FastAPI application configuration."""

import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from .api import auth, cvs, generations, jobs, users
from .core.exception_handlers import (
    authentication_exception_handler,
    entity_not_found_exception_handler,
    generation_exception_handler,
    generation_validation_exception_handler,
    validation_exception_handler,
)
from .core.exceptions import (
    AuthenticationError,
    EntityNotFoundError,
    GenerationError,
)
from .core.exceptions import (
    ValidationError as GenerationValidationError,
)
from .logger import setup_logging_middleware

# Only import test router if we're in a test environment
if os.environ.get("TESTING") == "1":
    from .api import test

# Create FastAPI application
app = FastAPI(title="CV Adapter Web Interface")


# Register exception handlers for specific exception types
@app.exception_handler(AuthenticationError)
async def handle_auth_error(request: Request, exc: AuthenticationError) -> JSONResponse:
    """Handle authentication errors."""
    return await authentication_exception_handler(request, exc)


@app.exception_handler(EntityNotFoundError)
async def handle_not_found_error(
    request: Request, exc: EntityNotFoundError
) -> JSONResponse:
    """Handle not found errors."""
    return await entity_not_found_exception_handler(request, exc)


@app.exception_handler(GenerationValidationError)
async def handle_gen_validation_error(
    request: Request, exc: GenerationValidationError
) -> JSONResponse:
    """Handle generation validation errors."""
    return await generation_validation_exception_handler(request, exc)


@app.exception_handler(GenerationError)
async def handle_gen_error(request: Request, exc: GenerationError) -> JSONResponse:
    """Handle generation errors."""
    return await generation_exception_handler(request, exc)


@app.exception_handler(ValidationError)
async def handle_validation_error(
    request: Request, exc: ValidationError
) -> JSONResponse:
    """Handle validation errors."""
    return await validation_exception_handler(request, exc)


# Setup middleware after exception handlers are registered
setup_logging_middleware(app)  # This adds RequestIDMiddleware

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "*"],
    max_age=3600,
)

# Include routers from api modules
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(cvs.router)
app.include_router(jobs.router)
app.include_router(generations.router)

# Include test router
if os.environ.get("TESTING") == "1":
    app.include_router(test.router)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
