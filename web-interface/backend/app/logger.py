import json
import logging
import os
import sys
import time
from typing import Any, Dict, Optional
from uuid import uuid4

from fastapi import FastAPI, Request, Response
from fastapi.exceptions import RequestValidationError
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.status import HTTP_422_UNPROCESSABLE_ENTITY

# Configure log level from environment variable
log_level = os.environ.get("LOG_LEVEL", "INFO").upper()


class JsonFormatter(logging.Formatter):
    """Custom JSON formatter with concise, relevant output."""

    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON with essential fields."""
        log_data = {
            "timestamp": self.formatTime(record, "%Y-%m-%d %H:%M:%S"),
            "level": record.levelname,
            "logger": record.name,
        }

        # Extract message and structured data
        try:
            # Try to parse message as JSON for structured logging
            structured_data = json.loads(record.getMessage())
            # Only include essential fields
            essential_fields = [
                "request_id",
                "method",
                "path",
                "status_code",
                "error",
                "duration_ms",
                "client_ip",
            ]
            for field in essential_fields:
                if field in structured_data:
                    log_data[field] = structured_data[field]
        except (json.JSONDecodeError, TypeError):
            # Fall back to plain message if not JSON
            log_data["message"] = record.getMessage()

        return json.dumps(log_data, indent=2)


def setup_logging() -> None:
    """Configure logging with JSON formatting."""
    formatter = JsonFormatter()
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    # Configure root logger
    logging.basicConfig(
        level=getattr(logging, log_level), handlers=[handler], force=True
    )


def get_logger(name: str) -> logging.Logger:
    """Get a configured logger instance."""
    return logging.getLogger(name)


# Create application loggers
logger = get_logger("cv-adapter")
auth_logger = get_logger("cv-adapter.auth")
api_logger = get_logger("cv-adapter.api")
db_logger = get_logger("cv-adapter.db")


async def _get_request_body(request: Request) -> Optional[Dict[str, Any]]:
    """Safely get request body for logging."""
    if request.method in ("POST", "PUT", "PATCH"):
        try:
            body = await request.json()
            # Mask sensitive fields
            if isinstance(body, dict):
                for sensitive_field in ["password", "token", "secret", "key"]:
                    if sensitive_field in body:
                        body[sensitive_field] = "***"
                return body
            return None
        except Exception:
            return None
    return None


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Middleware for request tracking and error logging."""

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        request_id = str(uuid4())
        request.state.request_id = request_id

        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response


async def handle_validation_error(
    request: Request, exc: RequestValidationError
) -> Dict[str, Any]:
    """Format validation errors for consistent logging."""
    return {
        "type": "ValidationError",
        "detail": exc.errors(),
        "body": await _get_request_body(request),
    }


def setup_logging_middleware(app: FastAPI) -> None:
    """Configure FastAPI application logging and error handling."""
    setup_logging()
    app.add_middleware(RequestIDMiddleware)

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> Response:
        request_id = getattr(request.state, "request_id", str(uuid4()))
        duration = (
            round((time.time() - request.state.start_time) * 1000, 2)
            if hasattr(request.state, "start_time")
            else None
        )
        error_details = await handle_validation_error(request, exc)

        # Log the error with essential information
        api_logger.error(
            json.dumps(
                {
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": HTTP_422_UNPROCESSABLE_ENTITY,
                    "duration_ms": duration,
                    "error": error_details,
                    "client_ip": request.client.host if request.client else None,
                }
            )
        )

        # Return a clean error response
        return Response(
            content=json.dumps(
                {"detail": exc.errors(), "request_id": request_id}, indent=2
            ),
            status_code=HTTP_422_UNPROCESSABLE_ENTITY,
            media_type="application/json",
        )
