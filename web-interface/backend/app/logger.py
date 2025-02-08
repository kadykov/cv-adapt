import json
import logging
import os
import sys
from typing import Any, Dict
from uuid import uuid4

from fastapi import Response

from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

# Configure log level from environment variable
log_level = os.environ.get("LOG_LEVEL", "INFO").upper()

class JsonFormatter(logging.Formatter):
    """Custom JSON formatter with pretty-printing."""

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self.default_keys = ['timestamp', 'service', 'level', 'path', 'line', 'message']

    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON."""
        log_data = {
            'timestamp': self.formatTime(record, self.datefmt),
            'service': record.name,
            'level': record.levelname,
            'path': record.pathname,
            'line': record.lineno,
            'message': record.getMessage()
        }

        # Add any extra fields from record
        if hasattr(record, 'request_id'):
            log_data['request_id'] = record.request_id

        # Handle extra fields for structured logging
        for key, value in record.__dict__.items():
            if key not in logging.LogRecord.__dict__ and key not in self.default_keys:
                log_data[key] = value

        return json.dumps(log_data, indent=2)

# Create formatters
json_formatter = JsonFormatter(datefmt='%Y-%m-%d %H:%M:%S')

# Create handlers
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setFormatter(json_formatter)

# Configure root logger
logging.basicConfig(
    level=getattr(logging, log_level),
    handlers=[console_handler],
    force=True  # Ensure our configuration takes precedence
)

def get_logger(name: str) -> logging.Logger:
    """Get a configured logger instance."""
    logger = logging.getLogger(name)
    logger.propagate = True
    return logger

# Create application loggers
logger = get_logger("cv-adapter")
auth_logger = get_logger("cv-adapter.auth")
api_logger = get_logger("cv-adapter.api")
db_logger = get_logger("cv-adapter.db")

class RequestIDMiddleware(BaseHTTPMiddleware):
    """Middleware to add a unique request ID to each request."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request_id = str(uuid4())
        request.state.request_id = request_id

        # Log incoming request with minimal info
        api_logger.debug(
            f"Request {request_id}",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "client_host": request.client.host if request.client else None
            }
        )

        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id

        # Log response status
        api_logger.debug(
            f"Response {request_id}",
            extra={
                "request_id": request_id,
                "status_code": response.status_code
            }
        )

        return response

def setup_logging(app: FastAPI) -> None:
    """Configure FastAPI application logging."""
    # Add request ID middleware
    app.add_middleware(RequestIDMiddleware)

    # Log FastAPI startup
    logger.info(
        "FastAPI application startup",
        extra={"log_level": log_level}
    )
